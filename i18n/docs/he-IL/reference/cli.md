<!-- source: 82b1f22a4618 -->

# שורת פקודה

הקובץ הניתן להרצה `vibe` הוא אפליקציית השולחן. כשהוא מקבל ארגומנט כלשהו מלבד `--hidden`, הוא מעביר את הארגומנטים ל-`vibe-server` המצורף ומדפיס את הפלט של אותו תהליך, כך שה-CLI והחלון משתמשים באותו מנוע ובאותם מודלים.

בינארי השרת הוא `vibe-server`; עותק פיתוח יכול לקרוא לו ישירות. `--help` בכל אחת מנקודות הכניסה מדפיס את הדגלים הנוכחיים.

## תת-פקודות

| פקודה | מטרה |
| --- | --- |
| `transcribe <model> <audio>` | תמלול קובץ אחד והדפסה או כתיבה של התוצאה |
| `serve [model]` | הפעלת שרת ה-HTTP המקומי, עם תיעוד Swagger |
| `pull <url>` | הורדת מודל או קובץ אחר |
| `devices` | רשימת התקני GPU כ-JSON |

## אפשרויות transcribe

| אפשרות | השפעה |
| --- | --- |
| `--format <txt\|markdown\|md\|json\|srt\|vtt>` | פורמט פלט; ברירת מחדל `txt` |
| `--output <path>` | כתיבה לקובץ חדש; מסרב לדרוס |
| `-l`, `--language <code>` | קוד שפה |
| `--detect-language` | זיהוי השפה |
| `--translate` | תרגום לאנגלית כאשר המודל תומך בכך |
| `--vad-model <path>` | מודל Silero VAD, נדרש בכמה משפחות לאודיו ארוך |
| `--diarize-model <path>` | מודל זיהוי דוברים |
| `--prompt <text>` | פרומפט התחלתי, למודלים שמשתמשים בו |
| `--word-timestamps` | פליטת חותמות זמן ברמת המילה כאשר נתמך |
| `--threads <n>` | טרדים של CPU |
| `--gpu-device <n>` | אינדקס התקן GPU, החל מ-1; `0` או שלילי פירושו אוטומטי |
| `--cache-dir <dir>` | שמירת מקטעים מושלמים כדי שהרצה שנקטעה תמשיך |
| `--chunk-seconds <n>` | אורך מקטע מתוכנן, מוגבל לפי חלון המודל |

`--enhance-audio`, `--temperature`, `--max-text-ctx`, `--max-segment-len`, `--best-of` ו-`--beam-size` מכווננים את המנוע; הריצו `--help` כדי לראות את ברירות המחדל שלהן.

## אפשרויות serve

| אפשרות | השפעה |
| --- | --- |
| `--host <ip>` | כתובת האזנה; ברירת מחדל `127.0.0.1` |
| `-p`, `--port <port>` | פורט; `0` בוחר פורט פנוי |
| `--exit-with-parent` | עצירה עם תהליך האב |
| `--unload-timeout <value>` | פריקת מודל לא פעיל |
| `--cache-dir <dir>` | תיקיית מטמון מקטעים |

**הגדרות → סוכנים** מפעיל את אותו שרת מהאפליקציה ומקשר לתיעוד ה-Swagger שלו.

## דוגמאות

```console
vibe transcribe model.gguf recording.wav --format srt --output recording.srt
vibe transcribe model.gguf recording.wav --language ru --vad-model ggml-silero-v6.2.0.bin
vibe devices
vibe serve --port 0
```

## דפים קשורים

- [מודלים](/vibe/docs#models) לבחירת מודלים ולמגבלות בכל משפחה.
- [פורמטים נתמכים](/vibe/docs#formats) לסיומות קלט ולפורמטי ייצוא.
