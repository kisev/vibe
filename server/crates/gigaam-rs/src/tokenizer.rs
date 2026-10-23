use std::ffi::{CStr, CString};

use crate::{sys, Error, Result};

/// GigaAM ships two vocabulary styles: SentencePiece pieces for the
/// end-to-end variants and a flat character list for the base variants.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VocabStyle {
    SentencePiece,
    Charwise,
}

#[derive(Debug, Clone)]
pub struct Tokenizer {
    tokens: Vec<String>,
    style: VocabStyle,
    blank_id: u32,
    unknown_id: Option<u32>,
}

impl Tokenizer {
    pub(crate) unsafe fn load(ctx: *const sys::gguf_context) -> Result<Self> {
        let model = optional_string(ctx, "tokenizer.ggml.model");
        let tokens = strings(ctx, "tokenizer.ggml.tokens")?;
        Self::from_parts(
            model.as_deref(),
            tokens,
            optional_uint(ctx, "tokenizer.ggml.blank_token_id"),
            optional_uint(ctx, "tokenizer.ggml.unknown_token_id"),
        )
    }

    fn from_parts(model: Option<&str>, tokens: Vec<String>, blank: Option<u32>, unknown_id: Option<u32>) -> Result<Self> {
        let style = match model.unwrap_or("bpe") {
            "bpe" | "unigram" => VocabStyle::SentencePiece,
            "char" => VocabStyle::Charwise,
            other => {
                return Err(Error::InvalidMetadata {
                    key: "tokenizer.ggml.model",
                    message: format!("unsupported tokenizer {other:?}"),
                })
            }
        };
        let blank_id = blank.ok_or(Error::MissingMetadata("tokenizer.ggml.blank_token_id"))?;
        if blank_id as usize >= tokens.len() {
            return Err(Error::InvalidMetadata {
                key: "tokenizer.ggml.blank_token_id",
                message: format!("blank id {blank_id} is outside the vocabulary of {}", tokens.len()),
            });
        }
        Ok(Self {
            tokens,
            style,
            blank_id,
            unknown_id,
        })
    }

    #[cfg(test)]
    pub(crate) fn for_test(tokens: Vec<String>, style: VocabStyle, blank_id: u32) -> Self {
        Self {
            tokens,
            style,
            blank_id,
            unknown_id: None,
        }
    }

    pub fn len(&self) -> usize {
        self.tokens.len()
    }

    pub fn is_empty(&self) -> bool {
        self.tokens.is_empty()
    }

    pub fn blank_id(&self) -> u32 {
        self.blank_id
    }

    pub fn unknown_id(&self) -> Option<u32> {
        self.unknown_id
    }

    pub fn style(&self) -> VocabStyle {
        self.style
    }

    pub fn piece(&self, id: u32) -> Option<&str> {
        self.tokens.get(id as usize).map(String::as_str)
    }

    pub fn decode(&self, ids: &[u32]) -> String {
        match self.style {
            VocabStyle::Charwise => ids.iter().filter_map(|&id| self.piece(id)).collect(),
            VocabStyle::SentencePiece => {
                let mut bytes = Vec::with_capacity(ids.len() * 4);
                for &id in ids {
                    let Some(piece) = self.piece(id) else { continue };
                    if let Some(byte) = byte_fallback(piece) {
                        bytes.push(byte);
                        continue;
                    }
                    let mut rest = piece.as_bytes();
                    while let Some(position) = rest.windows(3).position(|window| window == "▁".as_bytes()) {
                        bytes.extend_from_slice(&rest[..position]);
                        bytes.push(b' ');
                        rest = &rest[position + 3..];
                    }
                    bytes.extend_from_slice(rest);
                }
                String::from_utf8_lossy(&bytes).into_owned()
            }
        }
    }

    /// Decodes and drops control pieces. SentencePiece marks a word boundary
    /// with `▁`; the decoded text does not keep the leading space.
    pub fn decode_clean(&self, ids: &[u32]) -> String {
        let filtered = ids
            .iter()
            .copied()
            .filter(|&id| id != self.blank_id && Some(id) != self.unknown_id)
            .filter(|&id| {
                // Byte fallback pieces also look like `<...>`; keep them.
                self.piece(id)
                    .is_none_or(|piece| !(piece.starts_with('<') && piece.ends_with('>')) || piece.starts_with("<0x"))
            })
            .collect::<Vec<_>>();
        self.decode(&filtered).trim().to_owned()
    }
}

fn byte_fallback(piece: &str) -> Option<u8> {
    let hex = piece.strip_prefix("<0x")?.strip_suffix('>')?;
    (hex.len() == 2).then(|| u8::from_str_radix(hex, 16).ok()).flatten()
}

unsafe fn id(ctx: *const sys::gguf_context, key: &'static str) -> Result<i64> {
    let key_c = CString::new(key).unwrap();
    let id = sys::gguf_find_key(ctx, key_c.as_ptr());
    (id >= 0).then_some(id).ok_or(Error::MissingMetadata(key))
}

unsafe fn strings(ctx: *const sys::gguf_context, key: &'static str) -> Result<Vec<String>> {
    let id = id(ctx, key)?;
    (0..sys::gguf_get_arr_n(ctx, id))
        .map(|index| {
            let value = sys::gguf_get_arr_str(ctx, id, index);
            if value.is_null() {
                Err(Error::InvalidMetadata {
                    key,
                    message: format!("null string at {index}"),
                })
            } else {
                Ok(CStr::from_ptr(value).to_string_lossy().into_owned())
            }
        })
        .collect()
}

unsafe fn optional_uint(ctx: *const sys::gguf_context, key: &'static str) -> Option<u32> {
    let key = CString::new(key).ok()?;
    let id = sys::gguf_find_key(ctx, key.as_ptr());
    (id >= 0).then(|| sys::gguf_get_val_u32(ctx, id))
}

unsafe fn optional_string(ctx: *const sys::gguf_context, key: &'static str) -> Option<String> {
    let key = CString::new(key).ok()?;
    let id = sys::gguf_find_key(ctx, key.as_ptr());
    if id < 0 {
        return None;
    }
    let value = sys::gguf_get_val_str(ctx, id);
    (!value.is_null()).then(|| CStr::from_ptr(value).to_string_lossy().into_owned())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sentencepiece() -> Tokenizer {
        Tokenizer::for_test(
            vec![
                "<unk>".into(),
                "▁Важно".into(),
                "▁различать".into(),
                ".".into(),
                "<blank>".into(),
            ],
            VocabStyle::SentencePiece,
            4,
        )
    }

    #[test]
    fn decodes_sentencepiece_pieces() {
        let tokenizer = sentencepiece();
        assert_eq!(tokenizer.decode_clean(&[1, 2, 3]), "Важно различать.");
    }

    #[test]
    fn decodes_charwise_vocabulary() {
        let tokenizer = Tokenizer::for_test(
            vec![" ".into(), "а".into(), "б".into(), "<blank>".into()],
            VocabStyle::Charwise,
            3,
        );
        assert_eq!(tokenizer.decode_clean(&[1, 2, 0, 1]), "аб а");
    }

    #[test]
    fn decodes_byte_fallback_pieces() {
        let tokenizer = Tokenizer::for_test(
            vec![
                "▁".into(),
                "<0xE2>".into(),
                "<0x82>".into(),
                "<0xAC>".into(),
                "<blank>".into(),
            ],
            VocabStyle::SentencePiece,
            4,
        );
        assert_eq!(tokenizer.decode(&[0, 1, 2, 3]), " €");
    }

    #[test]
    fn rejects_missing_or_out_of_range_blank() {
        let tokens = vec!["а".to_owned(), "б".to_owned()];
        assert!(matches!(
            Tokenizer::from_parts(None, tokens.clone(), None, None),
            Err(Error::MissingMetadata("tokenizer.ggml.blank_token_id"))
        ));
        assert!(matches!(
            Tokenizer::from_parts(None, tokens.clone(), Some(2), None),
            Err(Error::InvalidMetadata {
                key: "tokenizer.ggml.blank_token_id",
                ..
            })
        ));
        assert!(matches!(
            Tokenizer::from_parts(Some("wordpiece"), tokens, Some(1), None),
            Err(Error::InvalidMetadata {
                key: "tokenizer.ggml.model",
                ..
            })
        ));
    }

    #[test]
    fn drops_special_and_unknown_pieces() {
        let tokenizer = sentencepiece();
        assert_eq!(tokenizer.decode_clean(&[0, 1, 3, 4]), "Важно.");
    }
}
