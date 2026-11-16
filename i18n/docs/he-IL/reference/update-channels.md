<!-- source: 63b7a2f2736b -->

# ערוצי עדכון

האפליקציה מתעדכנת מאחד משלושה קובצי ערוץ באתר, ולא מ"latest release" של GitHub:

| ערוץ | קובץ |
| --- | --- |
| Release | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

כל קובץ הוא ה-`latest.json` שבילד שחרור הפיק. ערוץ בלי קובץ הוא קו שאין בו דבר: האפליקציה מדווחת "מעודכן" במקום ליפול חזרה לערוץ אחר או להתייחס לקובץ החסר כאל בדיקה שנכשלה.

## קווים וגרסאות

| ערוץ | תג | ענף | גרסה | מה זה |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | הקו היציב |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | מועמד לגרסה היציבה הבאה, מפורסם כקדם-שחרור ב-GitHub |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | הבילד הנע של `dev` |

`beta.json` נעדר כשאף מועמד לא מפורסם. שחרור רגיל נדחה בערוץ beta; רק `X.Y.Z-rc.<n>` מתקבל שם.

## מהיכן מגיעים המניפסטים

- **Release ו-beta**: מעדכן ה-Tauri של בילד השחרור מפיק `latest.json`. `scripts/channel.py <version> --channel <stable|beta>` מוריד אותו מ-`https://github.com/kisev/vibe/releases/download/v<version>/latest.json`, מאמת את הגרסה וכותב `website/public/updater/<channel>.json`. בצעו קומיט של הקובץ ל-`main`; פריסת האתר מפרסמת אותו.
- **Dev**: `.github/workflows/dev-build.yml` מפרסם קדם-שחרור עם נכסי מעדכן ו-`latest.json`. `scripts/dev_manifest.py` קורא את שחרור ה-dev השלם החדש ביותר וכותב `website/public/updater/dev.json`; בילד dev חדש מפעיל את פריסת האתר. אם השחרור החדש ביותר חלקי או שקריאת ה-API נכשלת, ה-`dev.json` הקודם נשאר.

`channel.py` מסרב להזיז ערוץ אחורה ומבין את סדר ה-`-rc.<n>`.

## באפליקציה

- **הגדרות → כללי → עדכונים** נושא את בורר הערוץ, את הגרסה הנוכחית, **בדוק עדכונים**, את זמן הבדיקה האחרונה ואת התוצאה.
- בחירת הערוץ בזמן ריצה נמצאת ב-`desktop/src-tauri/src/updater.rs`; צד ה-webview הוא `desktop/src/providers/updater.tsx`.
- `desktop/src-tauri/src/updater.rs` בודק ישירות את `updater/<channel>.json`. `404` או `410` פירושו שהערוץ מעולם לא פורסם; כל כשל אחר הוא שגיאה אמיתית.
- נקודת הקצה הסטטית של תוסף Tauri ב-`tauri.conf.json` היא הנפילה החזרה שהתוסף עצמו מכיר; בחירת הערוץ קורית בקוד האפליקציה.

## גבולות

- המעדכן מתקדם רק קדימה. בילד רע מתוקן על ידי שליחת אחד חדש ממנו.
- התקנת Release או Beta שבוחרת Dev מציגה "מעודכן": כל בילד dev מדורג מתחת לגרסה שכבר רצה. המעבר לקו ה-dev דורש התקנה ידנית אחת של בילד dev; לאחר מכן ערוץ Dev מעדכן אותו קדימה.
- התקנת Beta עוברת לגרסה הסופית על ידי מעבר ל-Release, שבו `X.Y.Z` מדורג מעל המועמדים שלו.
- אפליקציות שנבנו לפני קובצי הערוץ (קו ה-3.x של upstream) עדיין קוראות את שחרור ה-GitHub שמסומן "latest". `gh release edit --latest` הוא מה שנשלח אליהן, ורץ אחרון.

ראו [פרסום שחרור](../how-to/publish-a-release.md) ו[חיתוך בילד dev](../how-to/cut-a-dev-build.md) להליכים, ואת [ההסבר](../explanation/update-channels.md) למה הקווים והסיומות מעוצבים כך.
