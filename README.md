# 波波桌面版

使用更加方便更加友好！


1. npm install 安装依赖
2. npm start 即可运行

如果要发布：
<pre>npm install electron-packager -g</pre>
然后
<pre>electron-packager . bobo --out ../electron</pre>
发布后的资源包缺少第三方依赖，在bobo中为html-minifier，复制require-node_modules.zip到resourse/app文件夹下并直接解压即可。

参数配置说明参见：https://github.com/yued-fe/bobo
