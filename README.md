# 波波桌面版

1. 界面UI以及交互由lulu提供技术支持；
2. 可视化配置，小白也能快速上手；
3. 采用最新的可呼起APP内分享的分享代码；
4. SVN配置独立，多人协作更加方便；
5. 自动生成文件脚手架，无需安装任何依赖和资源包，使用更加方便；
6. 开发目录更加简洁，除了一个config.json配置文件外，其他都是开发文件内容，更加友好！

## 下载
Mac: https://github.com/yued-fe/bobo/raw/master/electron/bobo-darwin-x64.zip<br>
Win: https://github.com/yued-fe/bobo/raw/master/electron/bobo-win32-x64.zip

也可以网盘下载（推荐）

Mac: 链接: http://pan.baidu.com/s/1pLsfOmf 密码: wykf<br>
Win: 链接: http://pan.baidu.com/s/1bFWCnO 密码: 8e4d

## 使用说明

<ol>
	<li>
		<h6>下载和安装</h6>
		<p>按照上面的地址下载安装包，免安装，直接解压，双击天蓝色圆圆的图标即可运行；</p>
	</li>
	<li>
		<h6>新建项目</h6>
		<p><img src="https://qidian.qpic.cn/qidian_common/349573/a78f7558e233bd11543a93244fa1ac14/0" width="330" height="176" alt="新建项目按钮位置示意图"></p>
		<h6>项目创建配置</h6>
		<p><img src="https://qidian.qpic.cn/qidian_common/349573/19346266bd9ec2a565478412198c0aca/0" width="557" height="394" alt="项目创建和编辑时候的几个配置项截图示意"></p>
   		<p>总共有3个配置：</p>
   		<ol>
   			<li><p>tapdID是项目唯一id，顾名思义，就是当前需求的id。如果是长期项目，如招聘官网之类，也可以使用类似yuewen之类的关键字作为id。</p></li>
   			<li><p>项目目录是本地开发的资源文件夹目录。如果是静态活动，或者可以走模板开发的动态活动，务必使用template_proj这个SVN项目，路径为trunk/acts/$year$。</p>
		    <p>由于波波会自动根据tapdID创建文件夹，因此，选择目录的时候直接到父级目录即可。举个例子，假设tapdID是123456，则目标开发文件夹应该是trunk/acts/2017/123456，但是，选择目录的时候只需要选到2017这层文件夹目录即可！</p>
		    <p><img src="https://qidian.qpic.cn/qidian_common/349573/c70d1fe7888514ed047c4b9d6151ef52/0" width="422" height="84" alt="文件夹只要选到2017这个年份目录即可示意"></p></li>
   			<li><p>项目名称就是项目的名称，例如“作家10年专题活动模板”，“推书活动模板”等。</p></li>
   		</ol>
   		<p>点击“确定创建”按钮后，波波就会基于配置创建项目基础脚手架。</p>
	</li>
	<li>
		<h6>基于脚手架进行开发与制作</h6>
		<p>点击“确定创建”按钮后，在目标文件夹，例如“trunk/acts/2017/123456”下会有如下脚手架目录：</p>
		<pre>src
  |--index.html
  |--css
  |--images
  |--js
config.json</pre>
		<p>脚手架文件内置一些必要的设定，例如CSS reset，统一的Zepto或者jQuery地址，以及一些使用策略和说明文档等。</p>
		<p>开发的时候，页面和CSS文件中都使用相对路径开发即可。其中，对于静态页面的相对地址，如果资源同级，务必使用<code>./</code>开头，例如使用<code>src="./images/logo.png"</code>而不是使用<code>src="images/logo.png"</code>，否则发布的时候地址替换会遇到麻烦。</p>
	</li>
	<li>
		<h6>项目基础配置</h6>
		<p>发布之前，需要先进行一些基础配置，如下：</p>
		<ul>
			<li>
				<p>SVN/Git仓库地址：</p>
				<p><img src="https://qidian.qpic.cn/qidian_common/349573/88a11fcf67d5e286c784734b22328210/0" alt="仓库地址" width="502" height="114"></p>
				<p>通常情况下，HTML模板对应的是<code>acts_qidian_pro</code>这个SVN项目，静态资源对应的是<code>gtimg_proj</code>这个SVN项目。</p>
				<p>同样的，选择到年份文件夹即可，波波会自动根据tapdid创建目标文件夹。</p>
			</li>
			<li><p>“参与版本控制的静态资源”就是开发时候使用的业务相关的CSS和JS资源，直接文件名即可，多个资源使用逗号分隔。</p></li>
			<li><p>“生成目录”，默认为<code>build</code>，这个通常没必要修改，也无法修改，最终发布的模板页面就会在这个文件夹下，和<code>src</code>文件夹平级。</p></li>
			<li><p>“替换路径”通常也没必要修改，除非你不使用波波自动生成的脚手架目录结构。</p></li>
			<li><p>“协议”默认为<code>https</code>，通常没有修改的必要。</p></li>
			<li>
				<p>“分享”这里如果分享图片缺省，则没有分享功能，如果有，则可以分享到微信。波波会自动根据这里的设置生成分享代码。同时支持点击页面某按钮触发分享，通常用来在app内呼起微信、微博之类的分享，默认值是<code>#shareBtn</code>，表示选择器为<code>#shareBtn</code>的元素可以呼起分享功能。如果没有特殊情况，请勿修改这个值，因为和静静有某种联系。</p>
				<p>分享图片请使用线上URL地址。</p>
				<p><strong>补充：</strong>很多情况下，设计师设计的页面上是没有分享按钮的，但，我们开发的时候，最好还是要加上。脚手架生成的<code>index.html</code>实际上是有示意的，默认白色定位在右上角，通过<code>hidden</code>属性隐藏，只会在app内和静静中显示。</p>
			</li>
			<li>“ta统计域名”选择当前专题使用的域名即可。如果选择海外版域名，会自动在生成的html页面中添加海外版标志量（lang属性），以便静静可以识别。</li>
			<li>“压缩”重点说明下最下面的CSS类名压缩忽略输入框，默认包括：<code>active,checked,disabled,selected,jpg,png,svg,gif</code>，CSS类名压缩只会压缩CSS文件和html页面中的类名，对于JS中的类名是不处理的，如果你的JS中有使用和样式关联的类名，则可以把这个使用的类名加入这个输入框中，就不会参与压缩。当然，更建议的方法是，样式类名不要和JS关联，实现分离。</li>
		</ul>
	</li>
	<li>
		<h6>发布</h6>
		<p>点击“发布页面”按钮，此时波波做了如下事情：</p>
		<ol>
			<li>对应资源自动会分发到SVN/git目录；</li>
			<li>静态资源版本递增（不包括图片），并拷贝到设置的SVN/git目录；</li>
			<li>类名压缩，并发布本地可直接预览版本到<code>build/public</code>文件夹下，如果此文件夹下的html页面预览异常，多半是JS中有样式类名导致；</li>
			<li>添加分享、统计等相关代码，并压缩html页面，保存在<code>build</code>目录下。直接预览无效果，需要把SVG/git中的静态资源全部发布上线、上线后，预览无问题即可发布html模板页面。</li>
		</ol>
	</li>
</ol>
	

## 升级说明

从v1.2.0版本开始，支持自动升级；v1.2.1支持跨版本升级。每次波波运行都会进行版本检测，当发现版本落后的时候，右下角会有升级按钮，点击此按钮即可升级。

<img src="https://qidian.qpic.cn/qidian_common/349573/40d1d88ae51e466723f75273e8465214/0" width="280" height="106" alt="升级按钮示意">

也可以手动升级，方法为github项目资源直接替换app文件夹中的资源：

windows：\resources\app<br>
OS X：显示包内容 → \Contents\Resources\app

千万要注意的是，千万不要清空或删除原来的app文件夹进行替换，采用覆盖的方式，例如其中的project.json是你之前的配置信息，删掉就男默女泪了。


## 开发说明

1. npm install 安装依赖
2. npm start 即可运行

如果要发布：
<pre>npm install electron-packager -g</pre>
然后
<pre>electron-packager . bobo --out ../electron</pre>
发布后的资源包缺少第三方依赖，在bobo中为html-minifier，复制require-node_modules.zip到resourse/app文件夹下并直接解压即可。