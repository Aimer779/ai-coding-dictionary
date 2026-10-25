# AI Coding Dictionary

本地复刻 [aicodingdictionary.com](https://www.aicodingdictionary.com/)。词条正文来自 [mattpocock/dictionary-of-ai-coding](https://github.com/mattpocock/dictionary-of-ai-coding)。该仓库没有 LICENSE，这个实验只在本地学习，不部署。

```powershell
pnpm install
pnpm test
pnpm dev
```

打开 http://127.0.0.1:5194/

## 模块

调用方向只有一条：界面和场景都读 `GraphFrame`，不互相读内部状态。

- `dictionary/` 把 JSON 收成目录。半径、邻居、分组顺序、搜索、Markdown 链接都在这里。不依赖 React 或 Three。
- `graph/` 根据查询和当前词算出一帧：位置、可见性、每条边的目标亮度、曲线是否拉直、相机看哪里。力模拟在 `force.ts` 里面，外面看不到。
- `session/` 只保存查询、选中、悬停、上色和声音，并把 `q` / `term` 写进地址。
- `scene/` 是把一帧画出来的适配器。换线的着色器只改 `Edges.tsx`。
- `chrome/` 是 DOM。面板和搜索不知道球的坐标。

换一份词典时，替换 `src/data/dictionary.json`，形状保持 `DictionaryDocument`。

## 这一版有意不同

- 搜索按标题和 slug 的词匹配。原站搜 “context window” 会留下大约 5 个词，包含标题里没有 window 的邻居。这里的匹配规则还没钉到他们的排序。
- 连线是面向屏幕的细线，带沿弧走动的点。原站是固定宽度的扁带，选中时还有一道阻尼抖动。深度虚化和胶片颗粒还没做。
- 分组上色在打开某个词时，把整帧背景染成该组的颜色。原站是双色调后期。
- 声音开关只记住状态。原站的界面音效没有取下来。
- 标签用本地等宽字画在精灵上，不是 Server Mono。
- 面板、搜索胶囊和四角圆钮按原站计算样式对齐：Helvetica Neue、面板宽 33.333vw、底 `#f2f2f0`、标题 `clamp(2.4rem, 4.4vw, 3.9rem)`。原站开场字和球体灰阶仍有景深后期，这里没有那一层。
- 球体颜色用原站的状态值：选中 2、相连 1.3、点中后无关 0.035、只悬停的无关 0.12。圆片着色散进纸色的公式沿用原着色器。形体仍是球体，没有原站的正面圆片、双色调后期和景深。
