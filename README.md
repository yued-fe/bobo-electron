# 波波桌面版

使用更加方便更加友好！


1. npm install 安装依赖
2. npm start 即可运行

如果要发布：
<pre>npm install electron-packager -g</pre>
然后
<pre>electron-packager . bobo --out ../electron</pre>
发布后的资源包缺少第三方依赖，在bobo中为html-minifier，复制require-node_modules.zip到resourse/app文件夹下并直接解压即可。



## 使用说明

1. 新建项目
   <img src="https://qidian.qpic.cn/qidian_common/349573/a78f7558e233bd11543a93244fa1ac14/0" width="330" height="176">
2. 项目创建配置
   如果是专题或活动页，可以使用纯数字的tapdid地址，如果是类似招聘官网之类的项目，可以使用类似yuewen之类的关键字作为id
   <img src="https://qidian.qpic.cn/qidian_common/349573/19346266bd9ec2a565478412198c0aca/0" width="557" height="394">
3. 项目基础配置
   项目创建成功后进行基础配置，参数配置说明参见：https://github.com/yued-fe/bobo
4. 静态页面开发与制作
5. 点击“发布页面”按钮，对应资源自动会分发到SVN目录，同时会自动添加分享，统计等相关代码，本地亦可预览。
