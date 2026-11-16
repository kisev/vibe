<!-- source: 63b7a2f2736b -->

# アップデートチャンネル

アプリは GitHub の最新リリースからではなく、ウェブサイト上の 3 つのチャンネルファイルのうち 1 つから更新します:

| チャンネル | ファイル |
| --- | --- |
| リリース | `https://kisev.github.io/vibe/updater/stable.json` |
| ベータ | `https://kisev.github.io/vibe/updater/beta.json` |
| 開発 | `https://kisev.github.io/vibe/updater/dev.json` |

各ファイルは、リリースビルドが生成した `latest.json` です。ファイルがないチャンネルは、何も載っていないラインです。アプリは別のチャンネルにフォールバックしたり、ファイルの欠落を確認の失敗として扱ったりするのではなく、「最新です」と報告します。

## ラインとバージョン

| チャンネル | タグ | ブランチ | バージョン | 内容 |
| --- | --- | --- | --- | --- |
| リリース | `vX.Y.Z` | `main` | `X.Y.Z` | 安定版のライン |
| ベータ | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | 次の安定版の候補。GitHub のプレリリースとして公開 |
| 開発 | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | `dev` の移動するビルド |

候補が公開されていない間は `beta.json` が存在しません。ベータチャンネルでは通常のリリースは拒否され、`X.Y.Z-rc.<n>` のみが受け付けられます。

## マニフェストの出所

- **リリースとベータ**: リリースビルドの Tauri アップデーターが `latest.json` を生成します。`scripts/channel.py <version> --channel <stable|beta>` がそれを `https://github.com/kisev/vibe/releases/download/v<version>/latest.json` からダウンロードし、バージョンを検証して、`website/public/updater/<channel>.json` に書き込みます。そのファイルを `main` にコミットします。ウェブサイトのデプロイがそれを公開します。
- **開発**: `.github/workflows/dev-build.yml` がアップデーターの成果物と `latest.json` を伴うプレリリースを公開します。`scripts/dev_manifest.py` が最新の完全な開発リリースを読み取り、`website/public/updater/dev.json` に書き込みます。新しい開発ビルドはウェブサイトのデプロイをディスパッチします。最新のリリースが不完全な場合、または API 呼び出しが失敗した場合は、以前の `dev.json` がそのまま残ります。

`channel.py` はチャンネルを後方に移動させることを拒否し、`-rc.<n>` の順序を理解します。

## アプリ内

- **設定 → 一般 → アップデート** には、チャンネルセレクター、現在のバージョン、**アップデートを確認**、最終確認時刻、結果があります。
- 実行時の選択は `desktop/src-tauri/src/updater.rs` にあり、webview 側は `desktop/src/providers/updater.tsx` です。
- `desktop/src-tauri/src/updater.rs` は `updater/<channel>.json` を直接プローブします。`404` または `410` はチャンネルが一度も公開されなかったことを意味し、それ以外の失敗は実際のエラーです。
- `tauri.conf.json` の Tauri プラグインの静的エンドポイントは、プラグイン自体が認識するフォールバックです。チャンネルの選択はアプリのコードで行われます。

## 境界

- アップデーターは前方向にのみ進みます。悪いビルドは、より新しいビルドを出荷することで修正されます。
- 開発を選んだリリースまたはベータのインストールでは「最新です」と表示されます。すべての開発ビルドは、すでに実行中のバージョンより下に位置するためです。開発ラインに移るには開発ビルドを 1 回手動でインストールする必要があり、その後は開発チャンネルが前方向に更新します。
- ベータのインストールはリリースに切り替えることで最終リリースに移ります。`X.Y.Z` はその候補より上に位置するためです。
- チャンネルファイルより前にビルドされたアプリ（上流の 3.x ライン）は、依然として「latest」とマークされた GitHub リリースを読み取ります。それらに出荷されるのは `gh release edit --latest` であり、最後に実行されます。

手順については[リリースを公開する](../how-to/publish-a-release.md)と[開発ビルドをカットする](../how-to/cut-a-dev-build.md)を、ラインとサフィックスがこの形になっている理由については[解説](../explanation/update-channels.md)を参照してください。
