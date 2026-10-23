use crate::{Token, Tokenizer, Transcription};

pub(crate) fn split_sentences(tokens: Vec<Token>, tokenizer: &Tokenizer) -> Vec<Transcription> {
    split_with(tokens, |slice| {
        let ids = slice.iter().map(|token| token.id).collect::<Vec<_>>();
        tokenizer.decode_clean(&ids)
    })
}

fn split_with(tokens: Vec<Token>, decode: impl Fn(&[Token]) -> String) -> Vec<Transcription> {
    let mut segments = Vec::new();
    let mut start = 0;
    for end in 1..=tokens.len() {
        let text = decode(&tokens[start..end]);
        if ends_sentence(&text) {
            segments.push(Transcription {
                text,
                tokens: tokens[start..end].to_vec(),
            });
            start = end;
        }
    }
    if start < tokens.len() {
        let text = decode(&tokens[start..]);
        if !text.is_empty() {
            segments.push(Transcription {
                text,
                tokens: tokens[start..].to_vec(),
            });
        }
    }
    segments
}

fn ends_sentence(text: &str) -> bool {
    matches!(text.trim_end().chars().last(), Some('.' | '?' | '!' | '…'))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn splits_on_punctuation() {
        let tokens = (0..5)
            .map(|index| Token {
                id: index,
                frame: index as usize * 10,
            })
            .collect();
        let pieces = ["Важно", " различать.", "Глаголы", " и", " дополнения."];
        let result = split_with(tokens, |slice| slice.iter().map(|token| pieces[token.id as usize]).collect());
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].text, "Важно различать.");
        assert_eq!(result[0].tokens.last().unwrap().frame, 10);
        assert_eq!(result[1].text, "Глаголы и дополнения.");
    }

    #[test]
    fn keeps_unpunctuated_text() {
        let tokens = vec![Token { id: 0, frame: 4 }, Token { id: 1, frame: 8 }];
        let pieces = ["важно", " различать"];
        let result = split_with(tokens, |slice| slice.iter().map(|token| pieces[token.id as usize]).collect());
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].text, "важно различать");
    }
}
