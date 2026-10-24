<!-- source: 2b80fd9e5daa -->

# 🌟 מודלים של Vibe 🌟

ברוכים הבאים לדף המודלים של Vibe! כאן תמצאו רשימה מוצעת ומאורגנת של מודלים לשימוש עם Vibe. כדי להתקין מודל, השתמשו בקישור "Magic Setup" כדי לפתוח אותו ב-Vibe, או העתיקו והדביקו את קישור ההורדה הישיר בהגדרות Vibe.

## הקלטות ארוכות

הקלטה ארוכה מחלון הקלט של המודל מפוצלת לקטעים לפני ההסקה. כשזיהוי דוברים מופעל, הפיצול עוקב אחרי תורי הדיבור שזוהו, כך שאף קטע לא מערבב שני דוברים מלבד במקום שבו התורים שלהם נפגשים — השורות האלה מציגות את שני הדוברים עם "?" ואפשר לשייך אותן לאחד מהם. GigaAM (25 שניות), Parakeet (30 שניות) ו-Nemotron (30 שניות) מפצלים כך; Whisper שומר על הטיפול שלו בהקלטות ארוכות.

קטעים שהסתיימו נשמרים במחשב שלכם, כך שהרצה חוזרת של קובץ ארוך עם אותן הגדרות ממשיכה מהמקום שבו עצרה. המטמון מכיל את טקסט התמלול, תוכנית הקטעים וחותמת מודל — אף פעם לא את האודיו — ולעולם לא עוזב את המכשיר שלכם. היישום מוחק בעת ההפעלה ערכים שלא נגעו בהם במשך 30 יום. בשורת הפקודה אפשר להפעיל עם `--cache-dir <folder>` ולמחוק את התיקייה הזו כדי לנקות אותו; `--chunk-seconds <n>` קובע את האורך המתוכנן ולא יכול לעלות על חלון המודל.

## מודלים זמינים

### 🌱 מודל Tiny

גרסה קומפקטית ויעילה, מתאימה למשימות מהירות ולסביבות עם משאבים מוגבלים.

[👈 Magic Setup](https://shorturl.at/XSP9R)  
[🔽 הורדה ישירה](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin?download=true)

### 🚀 Large v3 Turbo (מומלץ)

[👈 Magic Setup](https://tinyurl.com/yphwban5)  
[🔽 הורדה ישירה](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin)

### 🦜 Parakeet TDT 0.6B v3

תומך בהזרמה (streaming) ומתאים במיוחד להכתבה.

[👈 צפייה במודל](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/tree/main)  
[🔽 הורדת Q4_K_M](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/resolve/main/parakeet-tdt-0.6b-v3-Q4_K_M.gguf?download=true)

### ⚡ Nemotron 3.5 ASR Streaming 0.6B

תומך בהזרמה (streaming) ומתאים במיוחד להכתבה.

[👈 צפייה במודל](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf)  
[🔽 הורדת Q4_K_M](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/main/nemotron-3.5-asr-streaming-0.6b-Q4_K_M.gguf?download=true)

### 🇷🇺 GigaAM v3 (רוסית)

זיהוי דיבור ברוסית עם אותיות גדולות ופיסוק, מבית Salute Developers. מתאים במיוחד להכתבה ברוסית.

[👈 צפייה במודל](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf)  
[🔽 הורדת Q8_0](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/main/gigaam-v3-e2e-rnnt-Q8_0.gguf?download=true)

<details>
<summary>מגבלות GigaAM ודוגמאות לשורת הפקודה</summary>

**מגבלות**

- רוסית בלבד. אין זיהוי אוטומטי של השפה: `--language ru` ו-`--language auto` בוחרים ברוסית, וכל שפה אחרת נכשלת עם `unsupported_language`.
- אינו תומך בהזרמה (streaming). חלון המודל הוא 25 שניות, ומודל [Silero VAD](https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin) נדרש כדי לפצל הקלטות ארוכות.
- אין תרגום ואין הנחיית טקסט.
- חותמות זמן יציבות אינן נתמכות, והמודל מתעלם מבקשות לחותמות זמן ברמת מילה. כל מקטע כולל חותמות זמן של אסימונים ברזולוציה של 40 ms.
- זיהוי דוברים פועל כרגיל.
- ארבע גרסאות מפורסמות תחת `handy-computer`: [`gigaam-v3-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf), [`gigaam-v3-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf), [`gigaam-v3-e2e-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf), ו-[`gigaam-v3-e2e-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf). גרסאות ה-`e2e` מוסיפות אותיות גדולות ופיסוק; האחרות מחזירות טקסט באותיות קטנות ללא פיסוק.

**שורת פקודה**

הורידו את מודל ה-VAD שלמעלה והעבירו אותו עם `--vad-model`:

```console
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format markdown --output transcript.md
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format json
```

`--format` מקבל `txt` (ברירת מחדל), `markdown` (כינוי `md`), `json`, `srt` ו-`vtt`. `--output` כותב את התמלול לקובץ ומסרב לדרוס קובץ קיים. הוסיפו `--diarize-model <diar.gguf>` כדי לתייג דוברים בפלט Markdown ו-JSON.

</details>

### מודלים המותאמים לשפות נוספות

<details>
<summary>✡️ עברית (עברית)</summary>

מותאם במיוחד לנתוני שפה עברית, ומיועל למהירות ולדיוק גבוהים במשימות בעברית.

[👈 Magic Setup ‏(Large v3 Turbo)](https://tinyurl.com/t9r3tyxk)  
[🔽 הורדה ישירה (Large v3 Turbo)](https://huggingface.co/ivrit-ai/whisper-large-v3-turbo-ggml/resolve/main/ggml-model.bin?download=true)

**Parakeet TDT 0.6B v3 Hebrew**: גרסה של Parakeet TDT 0.6B v3 שאומנה במיוחד לעברית. מתאים להכתבה.

[👈 צפייה במודל](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-he-gguf)  
[🔽 הורדת Q8_0](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-he-gguf/resolve/main/parakeet-tdt-0.6b-v3-he-q8_0.gguf?download=true)

</details>

<details>
<summary>🇳🇴 נורווגית</summary>
	
מיועל לנורווגית על ידי [ה-AI Lab בספרייה הלאומית של נורווגיה](https://huggingface.co/NbAiLab).

[👈 Magic Setup ‏(medium)](https://tinyurl.com/5wzb9ux8)  
[🔽 הורדה ישירה (medium)](https://huggingface.co/NbAiLab/nb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👈 Magic Setup ‏(large)](https://tinyurl.com/f228efbu)  
[🔽 הורדה ישירה (large)](https://huggingface.co/NbAiLab/nb-whisper-large/blob/main/ggml-model.bin?download=true)

מודלים נוספים בגדלים קטנים יותר זמינים דרך [דף ההורדות שלהם ב-huggingface](https://huggingface.co/NbAiLab/nb-whisper-large).  
מצאו את הגודל הרצוי, הורידו את קובץ ה-_ggml-model.bin_, שנו את שם הקובץ, ומקמו אותו בתיקיית המודלים של vibe.

</details>

<details>
<summary>🇸🇪 שוודית</summary>

מיועל לשוודית על ידי [ה-Data Lab בספרייה הלאומית של שוודיה](https://huggingface.co/KBLab).

[👈 Magic Setup ‏(medium)](https://tinyurl.com/ynawnc33)  
[🔽 הורדה ישירה (medium)](https://huggingface.co/KBLab/kb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👈 Magic Setup ‏(large v3)](https://tinyurl.com/46dvpeky)  
[🔽 הורדה ישירה (large v3)](https://huggingface.co/KBLab/kb-whisper-large/blob/main/ggml-model.bin?download=true)

מודלים נוספים בגדלים קטנים יותר זמינים דרך [דף ההורדות שלהם ב-huggingface](https://huggingface.co/KBLab/kb-whisper-large).  
מצאו את הגודל הרצוי, הורידו את קובץ ה-_ggml-model.bin_, שנו את שם הקובץ, ומקמו אותו בתיקיית המודלים של vibe.

</details>
</details>

תיהנו מגילוי המודלים האלה ומשיפור חוויית ה-Vibe שלכם! 🌐✨

### רוצים עוד?

מודלים נוספים תמצאו כאן:

[👈 עוד מודלים](https://huggingface.co/ggerganov/whisper.cpp/tree/main)

---

### הכנת מודלים משלכם

<details>
<summary>המרת transformers ל-GGML</summary>

```console
# Setup environment
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
uv venv
uv pip install torch transformers huggingface_hub
huggingface-cli login --token "token" # https://huggingface.co/settings/tokens

# Convert and upload
git clone https://github.com/openai/whisper
git clone https://github.com/ggml-org/whisper.cpp
git clone https://huggingface.co/ivrit-ai/whisper-large-v3-turbo
uv run ./whisper.cpp/models/convert-h5-to-ggml.py ./whisper-large-v3-turbo/ ./whisper .
uv run huggingface-cli upload --repo-type model whisper-large-v3-turbo-ivrit ./ggml-model.bin ./ggml-model.bin

# Quantize
sudo apt install cmake build-essential -y
cd whisper.cpp
cmake -B build
cmake --build build --config Release
cd ..
./whisper.cpp/build/bin/quantize ggml-model.bin ./ggml-model.int8.bin q8_0 # fp32/fp16/q8_0/q5_0
```

</details>
