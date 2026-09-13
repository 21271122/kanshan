# 农场素材接入说明

规范依据：项目根目录《农场素材规范与接口设计.md》。

1. 图片放入 scenes、terrain、crops/default、mascot、effects 等语义目录。
2. 修改 lib/farm-assets.ts 的对应 AssetRef；确认 src、format、width、height。
3. 已交付文件设 available: true；尚未交付设 false，使用组件内置回退。
4. GIF 填 fallback PNG；一次性动作另填 loop: false、durationMs。
5. 更换作物不需要修改存档：assetFamily 未知时会回退到 default。
6. 实测正常显示、404/失败回退和 prefers-reduced-motion 后交付。

当前已有 mascot/idle.png，是 public/assets/liukanshan-idle.gif 的透明首帧。
当前其他场景与作物素材尚未交付，内置 SVG 负责完整可玩的回退视觉。

