# IQ計測ブックレット

図形推理・数列推理・数字の逆唱の3部構成で、推定IQを95%区間つきで表示するスマホ向けWebアプリ（PWA）です。
ホーム画面に追加すると全画面で起動し、オフラインでも動きます。ビルド工程はなく、静的ファイルだけで動作します。

## 構成

| ファイル | 役割 |
| --- | --- |
| `index.html` | 画面の骨組みとメタ情報 |
| `styles.css` | デザイントークンとレイアウト（ライト／ダーク両対応） |
| `app.js` | 問題の生成、出題フロー、採点、結果表示 |
| `sw.js` | オフライン用のService Worker（キャッシュ優先・裏で更新） |
| `manifest.webmanifest` / `icons/` | ホーム画面に追加するための定義とアイコン |

## 手元で動かす

Service Workerは `file://` では動かないため、簡易サーバーで開きます。

```sh
python3 -m http.server 8000
# http://localhost:8000 を開く
```

## 公開する（GitHub Pages）

1. リポジトリの Settings → Pages を開く
2. Source を「Deploy from a branch」、Branch を `main` / `(root)` にして保存
3. 数分後に `https://<ユーザー名>.github.io/iq_test/` で公開されます

パスはすべて相対指定なので、サブディレクトリ配下でもそのまま動きます。

## スマホに入れる

- **iPhone / iPad**：Safariで開き、共有メニュー →「ホーム画面に追加」
- **Android**：Chromeで開き、画面内の「ホーム画面に追加」ボタン、またはメニュー →「アプリをインストール」

## 更新するとき

ファイルを変更したら `sw.js` の `VERSION` を上げてください。古いキャッシュが破棄され、次回起動時に新しい版へ切り替わります。

## テストの中身

| パート | 内容 | 問題数・時間 |
| --- | --- | --- |
| 図形推理 | 3×3マトリクスの規則を見抜き、空欄を6択で埋める | 10問・各60秒 |
| 数列推理 | 数の並びの規則を見抜き、次の数を入力する | 10問・各45秒 |
| 数字の逆唱 | 1つずつ表示される数字を逆順で入力する | 3〜8桁・各2試行 |

採点は項目反応理論の3パラメータ・ロジスティックモデルで行い、平均100・標準偏差15の事前分布を置いたEAP推定で能力値と誤差を求めます。結果はこの端末のブラウザ（localStorage）にだけ保存され、外部には送信しません。

## 限界

- 標準化された心理検査ではありません。各問題の難易度は設計値で、実際の受検者データで較正していません。その不確かさ（能力値で±0.3標準偏差ぶん）は95%区間に上乗せしています。
- 測っているのは流動性推理（Gf）とワーキングメモリ（Gwm）だけです。語彙・知識や処理速度は含まず、WAIS-IVなどの全検査IQとは範囲が違います。
- 進学・採用・診断などの判断には使えません。

## 参考文献

- Carpenter, P. A., Just, M. A., & Shell, P. (1990). What one intelligence test measures. *Psychological Review, 97*(3), 404–431.
- Condon, D. M., & Revelle, W. (2014). The International Cognitive Ability Resource. *Intelligence, 43*, 52–64.
- Schneider, W. J., & McGrew, K. S. (2018). The Cattell–Horn–Carroll theory of cognitive abilities. In *Contemporary Intellectual Assessment* (4th ed.). Guilford Press.
- Bock, R. D., & Mislevy, R. J. (1982). Adaptive EAP estimation of ability in a microcomputer environment. *Applied Psychological Measurement, 6*(4), 431–444.
- Hausknecht, J. P., et al. (2007). Retesting in selection. *Journal of Applied Psychology, 92*(2), 373–385.
