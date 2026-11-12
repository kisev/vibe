<!-- source: 03e5a04c40fd -->

# Vibe をインストール

このチュートリアルは、ダウンロードから Vibe のウィンドウが動くまでを新しいマシンでたどります。インターネット接続のあるデスクトップで、Vibe がまだインストールされていない状態を前提とします。次のステップは[最初の録音を文字起こしする](/vibe/docs#first-transcription)です。

## インストーラーをダウンロードする

[ダウンロードページ](https://kisev.github.io/vibe/)を開き、このマシンに合うビルドを選びます:

| プラットフォーム | ビルド |
| --- | --- |
| Windows | `.exe` インストーラー |
| macOS、Apple silicon | `aarch64.dmg` |
| macOS、Intel | `x64.dmg` |
| Linux | `.deb` または `.rpm`、x86-64 または arm64 |

同じファイルが各 [GitHub リリース](https://github.com/kisev/vibe/releases)に添付されています。Linux の `.deb` は、`ffmpeg` を含む実行時の依存関係を宣言しています。

## インストールして開く

1. インストーラーを実行し、画面の指示に従います。
1. アプリケーションメニューから Vibe を開くか、ターミナルで `vibe` を実行します。

リリースビルドは署名されていません。macOS では初回起動時に Finder で右クリック → **開く** を選んで Gatekeeper を通過する必要があります。以降の起動は通常どおり開きます。Windows の SmartScreen も同じ理由で警告を表示することがあります。

## セットアップを完了する

初回起動時、Vibe はデフォルトモデルを提示します。ダウンロードを承認し、完了まで待ちます。モデルはローカルに保存され、以降の実行で再利用されます。代替モデルは[モデル](/vibe/docs#models)に一覧されています。

ドロップ領域と **録音**、**リンクから** の操作が表示されれば、ウィンドウの準備は完了です。

## 次のステップ

- [最初の録音を文字起こしする](/vibe/docs#first-transcription)では、このインストールを使用します。
- [対応フォーマット](/vibe/docs#formats)には、Vibe が開けるものとエクスポートできるものが一覧されています。
- [クラッシュのトラブルシューティング](https://github.com/kisev/vibe/blob/main/docs/how-to/troubleshoot-a-crash.md)では、ウィンドウが開かない場合のログと診断を扱います。
