# 从 ZIP 到提交：一步一步完成作业

截止时间：2026 年 11 月 17 日 23:59。博客发布需要审核，请提前完成。

## 0. 先了解目前完成到哪里

代码已经提供：页面、增删改查、收藏、多联系方式、Excel 导入导出、SQLite 保存、自动测试、部署配置、英文博客草稿。

你还必须亲自完成：阅读并理解代码；按课程规则参与修改；真实 Git 提交至少 3 次；填写自己的信息和 PSP；拍摄运行截图与视频；发布博客；发布 Release 并按要求提交 PR。云部署为选做加分。不要把没有做的步骤写成已经完成。

本项目是独立实现。原帖未列出要 Fork 的仓库链接，先向老师/助教确认；如果有指定基础项目或技术栈，应以课程要求为准，把本项目功能迁移到其结构，而不能只提交无关的新仓库。

## 1. 解压和准备 Python

1. 右键 ZIP → 全部解压。不要在压缩包内部运行。
2. 把含 `app.py` 的文件夹放到 `C:\Projects\NovaContacts`。如果有两层同名目录，进入内层，确保此处能看到 `app.py`。
3. 打开 PowerShell，执行 `py -3 --version`。需要 Python 3.11 或更高版本。
4. 若提示找不到 py，从 https://www.python.org/downloads/windows/ 安装 Python，并勾选 Add Python to PATH。安装后重新打开 PowerShell。

## 2. 启动程序（只开一个 PowerShell 即可）

逐行输入：

```powershell
cd C:\Projects\NovaContacts
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

看到 `Running on http://127.0.0.1:5000` 后，在浏览器地址栏输入：

http://127.0.0.1:5000

页面是英文的 NovaContacts。这个窗口需要一直开着。停止时按 Ctrl+C。
这里直接调用虚拟环境里的 Python，不需要执行 Activate.ps1，也无需修改 PowerShell 执行策略。

以后再次启动，只输入：

```powershell
cd C:\Projects\NovaContacts
.\.venv\Scripts\python.exe app.py
```

也可以双击 `start_windows.bat`。第一次需要联网安装依赖；安装成功后手动启动不需要重新下载。

## 3. 按顺序验证功能并截图

### 3.1 新增联系人和多种联系方式

1. 点右上角 New contact。
2. Name 填 `Alex Chen`，Company 填 `Example Studio`。
3. 第一条 Phone 填 `+86 13800000000`。
4. 点 Add method 再添加一条 Phone：`+86 13900000000`。
5. 再添加 Email：`alex@example.com`。
6. 再添加 Social：`@alex_demo`。
7. 再添加 Address：`123 Example Street`。
8. Notes 填 `Fictional course demonstration contact`。
9. 勾选 Add to favorites，点击 Save contact。
10. 再添加至少两名虚构联系人，方便演示。
11. 截图主页，保存为 `screenshots/01_home.png`；截取编辑弹窗所有联系方式，保存为 `02_methods.png`。

### 3.2 收藏与持久化

1. 点卡片右上角星星，空心变实心表示已收藏。
2. 点左侧 Favorites，只显示收藏联系人，截图为 `03_favorites.png`。
3. 取消收藏，确认该联系人从收藏页消失。
4. 再收藏回来，刷新浏览器；停止再启动 Python，确认数据还在。
5. 数据保存在 `instance/contacts.db`，不要删除；它不应上传 GitHub。

### 3.3 搜索、编辑、删除

1. 切回 All contacts，搜索 `alex`，再搜索邮箱或号码。
2. 点击 Edit contact，修改公司、移除一个号码、增加一个邮箱，保存并刷新。
3. 新建一个临时联系人，再点 Delete，确认后应消失。

### 3.4 Excel 导入

1. 点 Template，下载 `contacts_template.xlsx`。
2. 用 Excel/WPS 打开。首行标题必须保持不变。
3. 每个联系人占一行。favorite 为 0 或 1。
4. phones/emails/socials/addresses 单元格使用 JSON 数组，比如 `['a']` 是错误的，必须使用英文双引号：`["a"]`。
5. 多个号码的正确写法：`["+86 13800000000", "+86 13900000000"]`。
6. 没有该类信息则填 `[]` 或留空。Name 必填；文本字段不要填 Excel 公式。
7. 将示例姓名改为 `Morgan Lee`，邮箱改为 `morgan@example.com`，保存为 `.xlsx`。
8. 在网页点 Import Excel → 确认追加导入 → 选择文件。
9. 显示导入成功，并能找到 Morgan；截图为 `04_import.png`。
10. 再上传同一文件会新增重复数据，这是追加策略，页面有提示。

### 3.5 Excel 导出

1. 点击 Export Excel，下载 `contacts.xlsx`。
2. 打开检查每位联系人一行、各类信息单独一列；多个号码在 phones 单元格内用数组保存。
3. 截图 Excel 内容为 `05_excel.png`。手机号以文本存储，前导 0 和 + 号可保留。
4. 导出始终包括全部联系人，不受当前搜索/收藏筛选影响。
5. 可以删除一个专门用于测试的联系人后，将只含该联系人的 Excel 导入回来验证往返；不要随意删除真实数据。

### 3.6 错误处理

把模板第一格 name 改为 wrong 后上传，应显示表头错误，而且联系人总数不变。截图为 `06_validation.png`。

## 4. 运行测试

另外打开 PowerShell：

```powershell
cd C:\Projects\NovaContacts
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

末尾应显示 `Ran 16 tests` 和 `OK`。截图保存为 `07_tests.png`。不要把本包附带的生成环境测试记录冒充成你本机的测试截图。

## 5. GitHub、至少 3 次真实提交、Release 和 PR

### 5.1 优先使用老师指定仓库

1. 向助教确认原始仓库 URL；作业页没有给出链接，不能猜测。
2. 打开原仓库 → Fork → 选择你自己的账号。
3. 下载并安装 Git：https://git-scm.com/downloads 。重新打开 PowerShell。
4. 在你的 Fork 页面点 Code，复制 HTTPS 地址。

```powershell
cd C:\Projects
git clone https://github.com/YOUR_ACCOUNT/COURSE_REPOSITORY.git
cd COURSE_REPOSITORY
git switch -c feature/novacontacts
```

把 YOUR_ACCOUNT/COURSE_REPOSITORY 替换为自己的 Fork 地址。不要把已有项目的文件不加检查地覆盖掉。

### 5.2 做有意义的提交

如果课程仓库允许独立子项目，可把 `NovaContacts` 放入其中作为子目录，检查其 `.gitignore` 仍生效。若要求在原通讯录上增量开发，则逐模块迁移并测试。

建议按真实工作阶段完成以下提交（不是为了凑数而空提交）：

1. 理解后端和数据模型，完成自己的调整，提交后端功能。
2. 完成界面适配与自己的修改，提交前端。
3. 在本机测试，填写英文博客与实际证据，提交测试和文档。

独立项目、仓库根目录就是本包内容时，可以按下面分组提交：

```powershell
git config user.name "YOUR_NAME"
git config user.email "YOUR_GITHUB_EMAIL"
git add .gitignore app.py requirements.txt
git commit -m "feat: implement persistent contacts and Excel transfer"
git add templates static start_windows.bat
git commit -m "feat: add responsive contact editor and favorites view"
git add tests docs deploy screenshots README.md START_HERE_ZH.md
git commit -m "docs: add verified tests and assignment evidence"
git push -u origin feature/novacontacts
```

若本包在子目录，给上面文件路径统一加 `NovaContacts/` 前缀。先用 `git status` 检查暂存内容。不要提交 `.venv`、数据库、密码。不要把作者统一写成我，也不要伪造队友提交；每个人使用自己的身份贡献。

若助教明确不提供上游仓库并允许独立项目：在 GitHub 新建空仓库，然后在本包目录执行 `git init -b main`，再按上面的阶段提交；添加 `git remote add origin https://github.com/YOUR_ACCOUNT/NovaContacts.git` 后推送实际分支。此时没有上游可提 PR，应向助教确认 PR 的替代要求，不能假称已经 Fork。

### 5.3 提交统计和 PR

```powershell
git log --oneline --all --graph
git shortlog -sne --all
```

截图为 `08_git_history.png`，在博客写清每个人真实提交次数。
GitHub 的 Fork 页会出现 Compare & pull request，选择老师仓库规定的目标分支，创建 PR，标题可用 `Implement favorites, multiple contact methods and Excel transfer`，描述中写功能和测试结果。复制真实 PR 地址。若仓库不接受 PR，向助教确认提交方式。

### 5.4 发布 Release

确保最终文档和证据已提交到提交分支：

```powershell
git tag -a v1.0.0 -m "NovaContacts assignment release"
git push origin v1.0.0
```

GitHub → Releases → Draft a new release → 选择 v1.0.0 → 填标题和功能说明 → Publish release。只在完成全部真实检查后发布，不要把空模板当最终报告发布。

## 6. 可选：云部署（额外 15 分）

详细步骤见 `docs/DEPLOY_UBUNTU_ZH.md`。建议先完成本地测试和基本提交，再部署。
注意：本地 127.0.0.1 不算云部署，只有老师在其他设备也能访问的公网地址才算。本项目公开部署是共享演示库，只放虚构联系人。

## 7. 填写英文博客

打开 `docs/BLOG_TEMPLATE_EN.md`，所有 `[REPLACE: ...]` 都必须替换：

- 姓名、学号、团队、仓库、代码规范链接；
- 每人实际提交次数、PSP 计划与实际耗时；
- 实际截图、完整运行视频链接；
- 实际贡献比例与协作问题；独立完成时说明 independent work，不要保留虚构队友；
- PR、Release 和公网地址（没有云部署就明确未完成选做）。

把图片上传 CSDN 后，用它生成的图片链接替换 Markdown 内的相对路径，确认预览显示正常。README/博客草稿为英文；本文件和部署教程为给你看的中文操作指南，若老师规定整个仓库都不能含中文，提交时移除这两份中文指南。

## 8. 录制完整运行视频

建议 3–5 分钟连续展示：启动页面 → 新增 → 添加两条电话及邮箱/社交/地址 → 收藏/取消收藏 → 收藏页 → 搜索 → 编辑 → 下载模板 → 导入 → 导出并打开 Excel → 错误导入提示 → 刷新显示数据保留 → 可选公网访问。

Windows 可用 Win+G 录制浏览器窗口；需要切换浏览器和 Excel 时可使用 OBS 录屏。把完整视频上传到课程允许的平台，复制可访问链接到博客；用未登录窗口验证老师能打开。视频应由你实际录制，不用本包截图替代。

## 9. 提交前检查

参照 `docs/SUBMISSION_CHECKLIST.md` 逐项完成。两人组队时两人各发博客，各包含一份自己的 PSP；贡献比例合计 100%。提前发布等待审核，在作业页点“提交任务”提交自己的博客链接。

## 常见错误

- 找不到 app.py：当前目录不对；用 `dir` 确认，进入真正含 app.py 的文件夹。
- pip 找不到/虚拟环境激活受限制：按教程直接使用 `.venv\Scripts\python.exe`，不需要激活。
- ModuleNotFoundError：在项目目录重新执行虚拟环境 Python 的 pip 安装命令。
- 5000 端口占用：停止其他本项目进程；或执行 `.\.venv\Scripts\python.exe -m flask --app app:create_app run --port 5001`，然后访问 http://127.0.0.1:5001。
- 网页打不开：确认 Python 没有退出、地址和端口正确。不要双击 index.html。
- Excel 错误：只支持 .xlsx，保留精确表头，数组用英文双引号，每个联系人一行，禁止公式。文件上限 2 MiB、最多 5000 联系人。
- push 失败：使用 GitHub 浏览器授权或 PAT，不要将 token 写进仓库。先查看报错，不要直接强制推送。
