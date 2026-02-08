- Overview
  - Key Concept：Git中安全撤销代码的两种核心命令
  - Content：git revert通过创建新提交抵消旧改动，git reset移动HEAD指针改写历史
  - Visual Element：顶部标题栏+两个命令的图标（如revert用反向箭头，reset用回退箭头）
  - Text Labels：Git Revert vs Reset
- Section 1：git revert核心原理
  - Key Concept：通过新提交抵消旧改动
  - Content：假设提交历史是A→B→C，执行git revert B生成新提交D，历史变为A→B→C→D，D的状态=C的状态-B的改动
  - Visual Element：流程图展示提交链变化，用箭头和节点表示
  - Text Labels：提交历史、A→B→C、git revert B、生成D、A→B→C→D
- Section 2：git revert vs git reset对比
  - Key Concept：操作方式、历史记录、安全性、适用场景的区别
  - Content：
    |特性|git revert|git reset|
    |---|---|---|
    |操作方式|增加新提交抵消旧提交|移动HEAD指针丢弃提交|
    |历史记录|保留完整历史|抹除历史|
    |安全性|高|中/低|
    |适用场景|已推送远程分支|本地未推送分支|
  - Visual Element：左右分栏的对比表格，每一行用图标辅助
  - Text Labels：特性对比表
- Section 3：金律提示
  - Key Concept：远程分支必须用revert
  - Content：如果代码已推送到团队共享远程仓库，永远使用revert，reset会导致冲突
  - Visual Element：红色警告框+感叹号图标
  - Text Labels：金律：远程分支用revert，避免冲突