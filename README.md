# 波波桌面版

1. 界面UI以及交互由lulu提供技术支持；
2. 可视化配置，小白也能快速上手；
3. 采用最新的可呼起APP内分享的分享代码；
4. SVN配置独立，多人协作更加方便；
5. 自动生成文件脚手架，无需安装任何依赖和资源包，使用更加方便；
6. 开发目录更加简洁，除了一个config.json配置文件外，其他都是开发文件内容，更加友好！

## 下载
Mac: https://github.com/yued-fe/bobo/raw/master/electron/bobo-darwin-x64.zip
Win: https://github.com/yued-fe/bobo/raw/master/electron/bobo-win32-x64.zip

## 开发说明

1. npm install 安装依赖
2. npm start 即可运行

如果要发布：
<pre>npm install electron-packager -g</pre>
然后
<pre>electron-packager . bobo --out ../electron</pre>
发布后的资源包缺少第三方依赖，在bobo中为html-minifier，复制require-node_modules.zip到resourse/app文件夹下并直接解压即可。



## 使用说明

1. 向作者索要安装包，免安装，双击即可运行；
2. 新建项目<br><img src="https://qidian.qpic.cn/qidian_common/349573/a78f7558e233bd11543a93244fa1ac14/0" width="330" height="176">
3. 项目创建配置
   如果是专题或活动页，可以使用纯数字的tapdid地址，如果是类似招聘官网之类的项目，可以使用类似yuewen之类的关键字作为id<br><img src="https://qidian.qpic.cn/qidian_common/349573/19346266bd9ec2a565478412198c0aca/0" width="557" height="394">
4. 项目基础配置
   项目创建成功后进行基础配置，参数配置说明参见：https://github.com/yued-fe/bobo
5. 静态页面开发与制作
6. 点击“发布页面”按钮，对应资源自动会分发到SVN目录，同时会自动添加分享，统计等相关代码，本地亦可预览。

## 升级说明

当发生版本升级的时候，无需重新打包，只要替换app文件夹中的资源即可。

windows：\resources\app<br>
OS X：显示包内容 → \Contents\Resources\app

千万要注意的是，千万不要清空或删除原来的app文件夹进行替换，采用覆盖的方式，例如其中的project.json是你之前的配置信息，删掉就男默女泪了。
