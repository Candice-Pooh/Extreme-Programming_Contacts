# Ubuntu 云服务器部署教程（选做 +15 分）

此文件是部署操作方案，不表示已经部署。面向 Ubuntu 24.04，拥有 SSH 和 sudo 权限。先完成本地测试。

本方案使用 8088 端口，不替换服务器上已有的 80 端口网站（如你之前的计算器）。本项目无需另外启动前端。公开演示只有虚构数据，任何访问者均能编辑。

## 1. 服务器前置检查

先登录云控制台，找到服务器公网 IP。在 Windows PowerShell 中：

```powershell
ssh YOUR_USER@YOUR_PUBLIC_IP
```

YOUR_USER 和 YOUR_PUBLIC_IP 用你的实际值替换。若账号为 root，下面命令中的 sudo 可以省略。以下命令都在 SSH 登录后的 Linux 窗口执行：

```bash
sudo apt update
sudo apt install -y python3 python3-venv nginx git
sudo ss -ltnp
```

确认 5050 和 8088 没被其他服务占用。若有占用，选一组空闲端口，同时修改 service 的 bind 和 nginx.conf 的 listen/proxy_pass。

## 2. 上传代码

先将项目真实提交到 GitHub。仓库根目录应能看到 app.py；如果放在课程仓库子目录，请先 clone 到其他目录，再把对应子目录复制到 /opt/novacontacts，不要直接套用此处目录。

```bash
sudo git clone https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git /opt/novacontacts
cd /opt/novacontacts
sudo git checkout YOUR_SUBMITTED_BRANCH
sudo python3 -m venv .venv
sudo .venv/bin/python -m pip install -r requirements.txt
sudo .venv/bin/python -m unittest discover -s tests -v
sudo install -d -o www-data -g www-data -m 750 /var/lib/novacontacts
```

YOUR_SUBMITTED_BRANCH 替换成实际有代码的分支，如 feature/novacontacts。目录已存在时先检查内容，不要直接删除或覆盖其他服务。

## 3. 安装后台服务

```bash
sudo cp deploy/novacontacts.service /etc/systemd/system/novacontacts.service
sudo systemctl daemon-reload
sudo systemctl enable --now novacontacts
sudo systemctl status novacontacts --no-pager
curl http://127.0.0.1:5050/api/health
```

成功时返回含 `"ok":true` 的 JSON。数据由 www-data 写入 /var/lib/novacontacts/contacts.db，不随终端关闭而消失。

如果失败：

```bash
sudo journalctl -u novacontacts -n 60 --no-pager
```

确认项目在 /opt/novacontacts，虚拟环境完整，数据目录可写。不要使用 Flask 开发服务器作为公网服务。

## 4. 配置 Nginx

先检查下面目标文件名是否已有其他内容，避免覆盖已有站点；本项目独占 novacontacts 这个配置名。

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/novacontacts
sudo ln -s /etc/nginx/sites-available/novacontacts /etc/nginx/sites-enabled/novacontacts
sudo nginx -t
sudo systemctl reload nginx
curl http://127.0.0.1:8088/api/health
```

如果提示符号链接已经存在，先检查它是否确实指向本项目；不要重复创建或删除其他站点。只有 nginx -t 成功才 reload。

## 5. 开放 8088

在华为云/阿里云控制台，找到该实例的安全组，添加入站 TCP 8088；为了老师能访问，使用课程要求允许的来源范围。
如果系统已开启 UFW，还需要：

```bash
sudo ufw status
sudo ufw allow 8088/tcp
```

不要为了本项目开启或重置防火墙，不要关闭已有安全设置。Gunicorn 的 5050 只监听 127.0.0.1，不需要对外开放。

## 6. 外网验证

在你自己电脑浏览器打开（将 IP 换成真实公网 IP）：

```text
http://YOUR_PUBLIC_IP:8088/
http://YOUR_PUBLIC_IP:8088/api/health
```

用手机关闭 Wi-Fi、使用移动数据，再次打开；确认新增、收藏、Excel 上传下载都能工作。截图包含真实公网地址栏，供博客使用。

博客可填写：

```text
Public Frontend: http://YOUR_PUBLIC_IP:8088/
Public Backend Health: http://YOUR_PUBLIC_IP:8088/api/health
API Documentation: <GitHub 上 docs/API.md 的实际链接>
```

这里没有 Swagger /docs 页面，不要填写不存在的 /docs。

## 7. 更新与备份

更新代码前备份 SQLite，使用其备份 API而不是在服务写入时直接复制文件：

```bash
sudo python3 - <<'BACKUP'
import sqlite3
from datetime import datetime
name = '/var/lib/novacontacts/backup-' + datetime.now().strftime('%Y%m%d-%H%M%S') + '.db'
with sqlite3.connect('/var/lib/novacontacts/contacts.db') as source:
    with sqlite3.connect(name) as target:
        source.backup(target)
print(name)
BACKUP
cd /opt/novacontacts
sudo git pull --ff-only
sudo .venv/bin/python -m pip install -r requirements.txt
sudo .venv/bin/python -m unittest discover -s tests -v
sudo systemctl restart novacontacts
```

只在测试通过后重启。数据库放在项目目录外，git pull 不会覆盖它。若已经有自己的域名/HTTPS反向代理，可进一步配置，但这不是本次基本功能的前提。
