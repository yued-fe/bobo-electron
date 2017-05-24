// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var fs = require('fs');
stat = fs.stat;

var path = require('path');
var url = require('url');

var https = require('https');

var minify = require('html-minifier').minify;

var electron = require('electron');
var remote = electron.remote;

var dialog = remote.dialog;

var Menu = remote.Menu;
var MenuItem = remote.MenuItem;

/*
** jsonProject数据结构为：
** [
	{
		"tapdid": 1111,
		"directory": "/ss/ss/s/",
		"name": "项目名称"
	}
]
*/

({	
	dataStoreDir: (function () {
		if (typeof __dirname == 'string') {
			return url.format({
			    pathname: path.join(__dirname, 'project.json')
			});
		}
	})(),

	// 创建路径对应的文件夹（如果没有）
	createPath: function (path) {
		// 路径有下面这几种
		// 1. /User/...      OS X
		// 2. E:/mydir/...   window
		// 3. a/b/...        下面3个相对地址，与系统无关
		// 4. ./a/b/...
		// 5. ../../a/b/...  

		path = path.replace(/\\/g, '/');

		var pathHTML = '.';
		if (path.slice(0,1) == '/') {
			pathHTML = '/';
		} else if (/:/.test(path)) {
			pathHTML = '';
		}

		path.split('/').forEach(function(filename) {
			if (filename) {
				// 如果是数据盘地址，忽略
				if (/:/.test(filename) == false) {
					pathHTML = pathHTML + '/' + filename;
					// 如果文件不存在
					if(!fs.existsSync(pathHTML)) {
						// console.log('路径' + pathHTML + '不存在，新建之');
						fs.mkdirSync(pathHTML);
					}
				} else {
					pathHTML = filename;
				}
			}
		});
	},

	/*
	 * 复制目录中的所有文件包括子目录
	 * @param{ String } 需要复制的目录
	 * @param{ String } 复制到指定的目录
	 */
	copy: function (src, dst) {
		var self = this;

		if (!fs.existsSync(src)) {
			return;
		}

	    // 读取目录中的所有文件/目录
	    var paths = fs.readdirSync(src);

	    paths.forEach(function (dir) {
            var _src = path.join(src, dir),
                _dst = path.join(dst, dir),
                readable, writable;        

            stat(_src, function (err, st) {
                if (err) {
                    throw err;
                }

                // 判断是否为文件
                if (st.isFile()) {
                    // 创建读取流
                    readable = fs.createReadStream(_src);
                    // 创建写入流
                    writable = fs.createWriteStream(_dst);   
                    // 通过管道来传输流
                    readable.pipe(writable);
                } else {
                	// 作为文件夹处理
                	self.createPath(_dst);
                	self.copy(_src, _dst);
                }
            });
        });
	},

	createConfigJSON: function (obj) {
		var self = this;
		// 创建脚手架
		// 根据tapid创建文件夹
		var dirRoot = obj.directory;
		var tapdid = obj.tapdid;

		// 目标路径
		var dirWillCreate = path.join(dirRoot, tapdid);
		// 先复制src脚手架资源
		// 1. 创建目标文件夹
		fs.mkdirSync(path.join(dirWillCreate, 'src'));
		// 2. 复制
		this.copy(path.join(__dirname, 'src'), path.join(dirWillCreate, 'src'));

		// 然后创建config.json配置文件，此文件跟着项目走，因为可能多人合作
		var jsonConfig = {
			"versionFile": ["style.css", "script.js"],
			"build": {
				"pathHTML": "build"
			},
			"pathReplace": {
				"build": {
					"from": "./",
					"to": "https://qidian.gtimg.com/acts/"+ new Date().getFullYear() +"/"+ tapdid +"/"
				},
				"public": {
					"from": "./",
					"to": "../../src/"
				}
			},
			"share": {
				"img_url": "",
			    "desc": "分享描述",
			    "title": "分享标题"
			},
			"shareSelector": "#shareBtn",
			"ta": {
				"activity.book.qq.com": "500438403",
		        "activity.qidian.com": "500438401",
				"acts.book.qq.com": "500148454",
				"acts.qidian.com": "500148453",
				"acts.readnovel.com": "500438440"
			},
			"domain": "acts.qidian.com",
			"protocol": "https:",
			"compress": {
				"html": true,
				"className": true,
				"classIgnore": ["active", "checked", "disabled", "selected", "jpg", "png", "svg", "gif"]
			}
		};
		// 写入config.json文件
		fs.writeFileSync(path.join(dirWillCreate, 'config.json'), JSON.stringify(jsonConfig));
	},

	// 保存项目数据
	createProject: function (arr, callback) {
		var self = this;
		callback = callback || function () {};
		// 文件路径
		var dir = this.dataStoreDir;
		// 数据
		var jsonProject = this.jsonProject || [];

		// 插入对象
		var obj = {
			selected: true,
			svn: {
				pathHTML: '',
				pathStatic: ''
			}
		};

		if (arr && arr.length) {
			arr.forEach(function (keyValue) {
				obj[keyValue.name] = keyValue.value;
			});
		}

		// 默认新创建的选中
		jsonProject.forEach(function (objProject) {
			delete objProject.selected;
		});

		if (!obj.tapdid) {
			return;
		}

		// 创建脚手架
		// 根据tapid创建文件夹
		var dirRoot = obj.directory;
		var tapdid = obj.tapdid;

		// 目标路径
		var dirWillCreate = path.join(dirRoot, tapdid);

		// 创建该文件夹
		this.createPath(dirWillCreate);
		// 因为如果有该文件夹，并不会新建，因此，需要判断是否是空文件夹
		// 如果不是空文件夹，采取和github一样的策略，拒绝之
		if (fs.readdirSync(dirWillCreate).length > 0) {
			alert(dirWillCreate + '需要是空文件夹');
			return;
		}

		// 写入config JSON数据
		this.createConfigJSON(obj);
		
		// 新的项目数据插入
		jsonProject.push(obj);
		
		// 写入项目配置数据
		fs.writeFile(dir, JSON.stringify(jsonProject), function () {
			// 然后要把config公用配置带到项目中
			// 成功回调
			callback();

			// 在全局存储新的项目数据
			self.jsonProject = jsonProject;
			// 刷新左侧数据
			self.htmlProjectList();	
		});
	},

	// 编辑项目
	editProject: function (arr, callback) {
		var self = this;
		callback = callback || function () {};
		// 文件路径
		var dir = this.dataStoreDir;
		// 数据
		var jsonProject = this.jsonProject;

		// 求得当前匹配的左侧项目数据，
		// 然后进行替换
		// 先把arr转换成直接的键值对象
		var obj = {};
		arr.forEach(function (keyValue) {
			obj[keyValue.name] = keyValue.value;
		});

		var dirBefore = '';

		// 然后根据tapdid进行匹配
		jsonProject.forEach(function (objProject) {
			delete objProject.selected;

			if (objProject.tapdid == obj.tapdid) {
				// 编辑哪个，让哪个当前选中
				objProject.selected = true;
				// 之前的文件夹目录地址
				dirBefore = objProject.directory;
				// 进行替换
				for (var key in obj) {
					objProject[key] = obj[key];
				}
			}
		});

		// 目录转移
		// 创建脚手架
		// 根据tapid创建文件夹
		var dirRoot = obj.directory;
		var tapdid = obj.tapdid;

		// 目标路径
		var dirWillCreate = path.join(dirRoot, tapdid);

		// 创建该文件夹
		this.createPath(dirWillCreate);

		// 如果是空文件夹，移花接木
		if (fs.readdirSync(dirWillCreate).length === 0) {
			this.copy(path.join(dirBefore, tapdid), dirWillCreate);
		}

		// 重新写入并刷新
		// 写入项目配置数据
		fs.writeFile(dir, JSON.stringify(jsonProject), function () {
			// 然后要把config公用配置带到项目中
			// 成功回调
			callback();

			// 在全局存储新的项目数据
			self.jsonProject = jsonProject;
			// 刷新左侧数据
			self.htmlProjectList();	
		});
	},

	// 获取项目数据
	getProject: function () {
		var self = this;

		var dir = self.dataStoreDir;

		if (fs.existsSync(dir)) {
			fs.readFile(dir, 'utf8', function(err, data) {
				if (err) {
			        throw err;
			    }

			    if (data) {
			    	self.jsonProject = JSON.parse(data);
			    	// 刷新左侧数据
			    	self.htmlProjectList();
			    }
			});
		} else {
			// 刷新左侧数据
			self.htmlProjectList();
		}
	},

	updateProject: function () {
		var self = this;

		fs.writeFile(self.dataStoreDir, JSON.stringify(self.jsonProject), function (err) {
			// 在全局存储新的项目数据
			self.getProject();
		});
	},

	// 左侧类目刷新
	htmlProjectList: function () {
		var jsonProject = this.jsonProject;

		var html = '';
		if (jsonProject && jsonProject.length) {
			$.each(jsonProject, function (index, obj) {
				html = html + '<li><a href="javascript:" id="tapdid_'+ obj.tapdid +'" class="aside-li-a'+ (obj.selected? " active": "") +'" title="'+ obj.name +'">'+ obj.name +'</a><a href="javascript:" class="jsProEdit aside-li-a-icon" title="编辑" data-id="'+ obj.tapdid +'" aria-label="编辑" role="button"><svg class="icon"><use xlink:href="#icon-edit"></use></svg></a></li>';
			});
		}

		$('#asideUl').html(html);
		$('#loading').hide();

		// tips提示
	    $('#asideUl .jsProEdit').tips();

		// 右侧表单数据初始化
		this.initFormData();
	},

  	// 新建项目
  	eventCreateProject: function () {
  		var self = this;

    	var elBtnCreate = $('#btnCreateProject');
    	var elTplCreate = $('#tplDialogCreate');

    	elBtnCreate.on('click', function () {
	      	var dialogCreate = new Dialog({
	        	title: '创建项目',
	        	content: elTplCreate.html(),
	        	width: 550,
	        	onShow: function () {
	          		var elForm = this.el.body.find('form');
	          		var elSubmit = elForm.find('input[type="submit"]');
	          		// 验证
	          		new Validate(elForm, function() {
	            		// 验证成功之后
	            		// 本地塞数据
	            		var data = elForm.serializeArray();

	            		elSubmit.loading();

	            		self.createProject(data, function () {
	            			// 写入成功后

	            			// 弹框关闭
	            			dialogCreate.remove();
	            		});
	          		}, {
	        			label: true,
	        			validate: [{
	        				// tapdid是否重复验证
	        				id: 'projTapdid',
	        				method: function (el) {
	        					var tapdid = el.val();
	        					if (self.jsonProject && self.jsonProject.some(function (obj) {
	        							return obj.tapdid == tapdid;
			          				})) {
			          				return '此TapdID已经存在';
			          			}
	        				}
	        			}]
	      			});

	      			// 文件夹选择
	      			$('#localDir').on('click', function () {
	      				self.showOpenDialog(function (filename) {
	      					$('#projDir').val(filename).trigger('change');
	      				});
	      			});

	      			// 项目目录标记
	        		new Datalist($('#projDir'));
	        	}
      		});
    	});
 	},

 	// 编辑项目
 	eventEditProject: function () {
 		var self = this;

 		// 需要的一些元素
 		var elUl = $('#asideUl');
 		var elTplCreate = $('#tplDialogCreate');

 		elUl.delegate('.jsProEdit', 'click', function () {
 			var tapdid = $(this).attr('data-id');

 			var dialogEdit = new Dialog({
	        	title: '编辑项目',
	        	content: elTplCreate.html(),
	        	width: 550,
	        	onShow: function () {
	          		var elForm = this.el.body.find('form');
	          		var elSubmit = elForm.find('input[type="submit"]');
	          		var elDir = $('#projDir');

	          		$('#projTapdid').val(tapdid).attr('readonly', 'readonly');

	          		var jsonProject = self.jsonProject;

	          		// 根据jsonProject数据获得当前tapdid对应的数据
	          		// jsonProject是个对象数组，因此
	          		var dataEdit = jsonProject.filter(function (obj) {
	          			return obj.tapdid == tapdid;
	          		})[0];

	          		elDir.val(dataEdit.directory || '');
	          		$('#projName').val(dataEdit.name || '');

	          		// 验证
	          		new Validate(elForm, function() {
	            		// 验证成功之后
	            		// 本地塞数据
	            		var data = elForm.serializeArray();

	            		elSubmit.loading();

	            		self.editProject(data, function () {
	            			// 写入成功后
	            			// 弹框关闭
	            			dialogEdit.remove();
	            		});
	          		});

	      			// 文件夹选择
	      			$('#localDir').on('click', function () {
	      				self.showOpenDialog(function (filename) {
	      					elDir.val(filename).trigger('change');
	      				});
	      			});

	      			elSubmit.val('确认修改');

	      			// 项目目录标记
	        		new Datalist(elDir);
	        	}
      		});
 		});
 	},

  	// 右侧项目提交按钮的居底固定处理
  	eventFooterFixed: function () {
	    var elConfigFooter = $('#configFooter');

	    var isFooterFixed = function () {
			var eleContent = document.querySelector('.content');
			if (!eleContent) { return; }
			if (eleContent.scrollHeight > eleContent.clientHeight || eleContent.scrollTop > 0) {
				elConfigFooter.addClass('fixed');
			} else {
				elConfigFooter.removeClass('fixed');
			}
	    };

	    isFooterFixed();

	    $(window).on('resize', isFooterFixed);
  	},

  	// 左侧切换项目等事件
  	eventAside: function () {
  		var self = this;
  		var elUl = $('#asideUl');

  		elUl.delegate('a', 'click', function () {
  			var elBtn = $(this);
  			var id = elBtn.attr('id');

  			var tapdid = id && id.replace('tapdid_', '');

  			// 根据tapdid改变左侧状态
  			if (self.jsonProject &&elBtn.hasClass('active') == false && tapdid) {
  				self.jsonProject.forEach(function (obj) {
  					delete obj.selected;
  					if (obj.tapdid == tapdid) {
  						obj.selected = true;
  					}
  				});

  				// 刷新
  				self.updateProject();
  			}
  		});
  	},

  	// 获取file类型输入框的地址
  	showOpenDialog: function (callback) {
  		if (!$.isFunction(callback)) {
  			return this;
  		}
  		if (dialog) {
  			dialog.showOpenDialog({
	  			properties: ['openDirectory', 'createDirectory']
	  		}, callback);
  		} else {
  			console.error('dialog不存在');
  		}
  	},

  	// 右侧数据内容填充和初始化
  	initFormData: function () {
  		var self = this;
  		// 选中的项目元素
 
  		// 根据id找到一些配置数据
  		var jsonProject = this.jsonProject;
  		if (!jsonProject) {
  			return this;
  		}

  		// 根据selected属性确定哪个是当前选中的对象
  		var jsonProjectSelected = jsonProject.filter(function (obj) {
  			if (obj.selected) {
  				return obj;
  			}
  		})[0];

  		if (!jsonProjectSelected) {
  			// 如果没有选中项，让第一个选中（如果有）
  			if (jsonProject[0]) {
  				this.jsonProject[0].selected = true;
  				this.htmlProjectList();
  			}
  			return this;
  		}

  		// 从路径中找到项目的config.json
  		var pathJsonConfig = path.join(jsonProjectSelected.directory, jsonProjectSelected.tapdid, 'config.json');

  		// 读取配置数据
  		var strJsonConfig = fs.readFileSync(pathJsonConfig, 'utf8');
  		if (!strJsonConfig) {
  			alert('项目目录中的配置数据读取异常');
  			return this;
  		}
  		var jsonConfig = JSON.parse(strJsonConfig);
  		// 全局，页面发布时候需要
  		self.jsonConfig = jsonConfig;

  		// 数据合并处理
  		var config = $.extend({}, jsonProjectSelected, jsonConfig);

  		// 数据都备好了，下面就是数据同步了
  		var elForm = $('#configForm');
  		// 对所有表单元素进行遍历
  		elForm.find(':input').each(function () {
  			var ele = this, el = $(ele);
  			// name值
  			var name = ele.name;
  			// type类型
  			var type = ele.type;

  			if (!name || !type) {
  				return;
  			}

  			var arrName = name.split('.');

  			var value = '';

  			arrName.forEach(function (key) {
  				if (value) {
  					value = value[key];
  				} else {
  					value = config[key];
  				}
  			});

  			if ($.isArray(value)) {
  				value = value.join();
  			}

  			// 下拉框特殊处理
  			if (/select/i.test(type)) {
  				el.find('option').each(function () {
  					var option = this;
  					if (option.value == value) {
  						option.selected = true;
  					}
  				});
  				// 刷新下拉
  				el.selectMatch();
  			} else if (type == 'radio') {
  				if (ele.value == value) {
  					ele.checked = true;
  				}
  			} else if (type == 'checkbox') {
  				ele.checked = value;
  			} else {
  				// 其他赋值
  				ele.value = value;
  			}
  		});

  		elForm.data('isChanged', true);
  	},

  	// 右侧表单元素事件初始化
  	initFormElements: function () {
  		var self = this;
  		$('#taSel').selectMatch();

  		// 选择文件夹
  		$('.jsFile').on('click', function () {
  			var elBtn = $(this);
  			self.showOpenDialog(function (filename) {
  				elBtn.prev('input').val(filename).trigger('change');
  				elBtn.parents('form').data('isChanged', true);
  			});
		});

		// 协议切换和同步
		var elPathReplaceBuildTo = $('#pathReplaceBuildTo'), elWxShareImg = $('#wxShareImg');
		$('input[name="protocol"]').on('click', function () {
			elPathReplaceBuildTo.val(elPathReplaceBuildTo.val().replace(/(^[a-z]+:)?\/\//, this.value + '//'));
			// 微信分享不能无协议
			elWxShareImg.val(elWxShareImg.val().replace(/(^[a-z]+:)?\/\//, (this.value || 'https:') + '//'));
		});
		elWxShareImg.on('blur', function () {
			$('input[name="protocol"]:checked').trigger('click');
		});
		elPathReplaceBuildTo.on('blur', function () {
			$('input[name="protocol"]:checked').trigger('click');
		});

		// 是否压缩
		var elCompressClArea = $('#compressClArea');
		$('#compressCl').on('click', function () {
			if (this.checked) {
				elCompressClArea.removeAttr('disabled');
			} else {
				elCompressClArea.attr('disabled', 'disabled');
			}
		});

		// 表单提交处理
		var elForm = $('#configForm');

		// 第一次标记配置
		elForm.data('isChanged', true);

		elForm.on('change', function () {
			elForm.data('isChanged', true);
		});

		new Validate(elForm, function () {
			// 验证成功后
			// 1. config数据更新
			if (elForm.data('isChanged')) {
				self.updateConfig(elForm.serializeArray());
			} else {
				// 直接发布
				self.publish();
				// 还原状态
				elForm.data('isChanged', false);
			}
		}, {
			label: true
		});

		// 微信分享图片预览
		self.wxShareImgPreview();

		// 记住SVN地址
		new Datalist($('#svnPathHTML'));
		new Datalist($('#svnPathStatic'));
  	},

  	wxShareImgPreview: function () {
  		var elBtnPreview = $('#btnImgPreview');
  		// 图片预览效果
		var elThumbTarget = null, objHasLoaded = {};
		elBtnPreview.on('mouseover', function() {
			var url = $(this).prev('input').val(), elThumbTarget = $('#TBTgt');
			if (url) {
				if (!elThumbTarget.length) {
					elThumbTarget = $('<div id="TBTgt" class="ui-dropanel-x"></div>').appendTo($(document.body));
				}

				// 显示图片方法
				var _view = function() {
					elThumbTarget.html('<img src="'+ url +'" width="100%">');
				};

				if (!objHasLoaded[url]) {
					elThumbTarget.html('<div style="height:100px;"></div>')
					.children('div').loading();

					var thumbImage = new Image();
					thumbImage.onload = function() {
						objHasLoaded[url] = true;
						_view();
					};
					thumbImage.onerror = function() {
						elThumbTarget.html('<div style="line-height:100px;">图片加载出现异常</div>');
					};
					thumbImage.src = url;
				} else {
					_view();
				}

				new Drop($(this), elThumbTarget, {
					offsets: {
						x: 10,
						y: 0
					},
					position: '2-1'
				});
			}
		});

		elBtnPreview.on('mouseout', function() {
			var url = $(this).prev('input').val();
			if (url) {
				$('#TBTgt').hide();
			}
		});
  	},

  	log: function (text) {
  		var self = this;

  		// 日志数据
  		var arrLog = self.arrLog || [];
  		var elLog = $('#publishLog');
  		if (!elLog.length || !arrLog.length) {
  			self.dialogLog = new Dialog({
	  			title: '发布日志',
	  			content: '<div id="publishLog" class="publish-log"></div>',
	  			onRemove: function () {
	  				self.arrLog = [];
	  			}
	  		});
	  		elLog = $('#publishLog');

	  		elLog.delegate('.closeDialog', 'click', function () {
	  			self.dialogLog.remove();
	  		});
  		}

  		arrLog.push(text);
		elLog.html(arrLog.join('<br>'));
		self.arrLog = arrLog;
  	},

  	// 配置文件更新
  	updateConfig: function (arr) {
  		var self = this;
  		// 1. 安装目录中的project.config的svn配置
  		// 2. 项目目录的config.json配置更新
  		var jsonProject = self.jsonProject;
  		var jsonConfig = self.jsonConfig;

  		if (!arr || !arr.length) {
  			return;
  		}

  		// 根据selected属性确定哪个是当前选中的对象
  		var jsonProjectSelected = jsonProject.filter(function (obj) {
  			if (obj.selected) {
  				return obj;
  			}
  		})[0];
  		
  		self.log('正在更新配置信息...');

  		// 非选中复选框无数据，因此默认置为false
  		jsonConfig.compress.html = false;
  		jsonConfig.compress.className = false;

  		arr.forEach(function (obj) {
  			var name = obj.name, value = obj.value;

  			var arrName = name.split('.');

  			if (arrName[0] == 'svn') {
  				// svn地址
  				jsonProjectSelected.svn[arrName[1]] = value;
  			} else if (name == 'versionFile') {
  				// 版本控制文件
  				jsonConfig[name] = value.split(/\s*,\s*/);
  			} else if (name == "compress.html" || name == "compress.className") {
  				// 压缩HTML
  				jsonConfig[arrName[0]][arrName[1]] = true;
  			} else if (name == 'compress.classIgnore') {
  				// 压缩忽略的类名
  				jsonConfig[arrName[0]][arrName[1]] = value.split(/\s*,\s*/);
  			} else if (arrName.length == 3) {
  				// 路径替换规则
  				jsonConfig[arrName[0]][arrName[1]][arrName[2]] = value;
  			} else if (arrName.length == 2) {
  				// 发布目录，分享数据
  				jsonConfig[arrName[0]][arrName[1]] = value;
  			} else {
  				// ta统计域名、协议、页面上的分享按钮选择器
  				jsonConfig[name] = value;
  			}
  		});

  		// 从路径中找到项目的config.json
  		var pathJsonConfig = path.join(jsonProjectSelected.directory, jsonProjectSelected.tapdid, 'config.json');
  		// 保存到project.config中
  		// 写入项目配置数据
		fs.writeFile(self.dataStoreDir, JSON.stringify(jsonProject), function (err) {
			// 然后要把config公用配置带到项目中
			// 在全局存储新的项目数据
			self.jsonProject = jsonProject;
			self.log('SVN配置更新完毕。');

			// 写入config.json文件
			fs.writeFileSync(pathJsonConfig, JSON.stringify(jsonConfig));
			self.jsonConfig = jsonConfig;
			self.log('项目基础配置更新完毕。');

			// 开始压缩处理
			self.publish();
		});

  	},

  	publish: function () {
  		// 版本递增，SVG转移，HTML压缩，统计注入等处理
  		var self = this;
  		// 1. 安装目录中的project.config的svn配置
  		// 2. 项目目录的config.json配置更新
  		var jsonProject = self.jsonProject;
  		var jsonConfig = self.jsonConfig;

  		// 当前项目的SVN配置
  		var jsonProjectSelected = jsonProject.filter(function (obj) {
  			if (obj.selected) {
  				return obj;
  			}
  		})[0];

  		var tapdid = jsonProjectSelected.tapdid;

  		if (!tapdid) {
  			alert('tapdid缺失！');
  			return;
  		}

  		// 类名压缩的映射数据
  		self.hashClassName = {};
  		// 类名压缩序号
  		self.indexClassName = 0;

  		// svn模板和静态资源目录
  		var dirSVNHTML = jsonProjectSelected.svn.pathHTML;
  		var dirSVNStatic = jsonProjectSelected.svn.pathStatic;
  		// 项目资源目录
  		var dirRoot = jsonProjectSelected.directory;
		// 目标路径
		var dirProject = path.join(dirRoot, tapdid, 'src');

  		// 如果目录最后一层就是当前tapdid，则不新建，否则，根据tapdid先创建文件夹
  		var arrLastDirHTML = dirSVNHTML.replace(/\w$/, '').split(/\/|\\/);
  		var arrLastDirStatic = dirSVNStatic.replace(/\w$/, '').split(/\/|\\/);

  		if (arrLastDirHTML[arrLastDirHTML.length - 1] !== tapdid) {
  			self.log('创建SVN模板资源文件夹...');
  			dirSVNHTML = path.join(dirSVNHTML, tapdid);
  		}

  		self.createPath(dirSVNHTML);
		// 更新
		jsonProjectSelected.svn.pathHTML = dirSVNHTML;

  		if (arrLastDirStatic[arrLastDirStatic.length - 1] !== tapdid) {
  			self.log('创建SVN静态资源文件夹...');
  			dirSVNStatic = path.join(dirSVNStatic, tapdid);
  		}
  		self.createPath(dirSVNStatic);
  		// 更新
		jsonProjectSelected.svn.pathStatic = dirSVNStatic;

  		// 暴露数据更新，之后的版本递增，资源复制等需要
  		self.jsonProjectSelected = jsonProjectSelected;

  		// 对于静态资源文件目录，还需要对JS,CSS,Images文件夹进行拷贝
  		// 方法如下：
  		// 遍历项目src资源目录，复制所有文件夹内容
  		// 读取目录中的所有文件/目录
  		self.log('拷贝静态资源到SVN目录...');
	    fs.readdirSync(dirProject).forEach(function (dir) {
            var _src = path.join(dirProject, dir);
            var _dst = path.join(dirSVNStatic, dir);
            stat(_src, function (err, st) {
                // 判断是否为文件夹
                if (!st.isFile()) {
                	self.createPath(_dst);
                	self.log(dir + '文件夹中静态资源拷贝到SVN...');
                	self.copy(_src, _dst);
                }
            });
        });

	    // 静态资源版本递增的逻辑实现
		// 首先，所有JS和CSS进入storeStatic进行统一的管理
		// 默认都认为是没有修改的
		self.storeStatic = jsonConfig.versionFile.map(function(filename) {
			return {
				isModify: false,
				filename: filename
			};
		});

		var storeStatic = self.storeStatic;

		// 获得存储的最新的递增的文件版本
		// 编译路径
		var dirProject = path.join(dirRoot, tapdid, jsonConfig.build.pathHTML);
		var pathSql = path.join(dirProject, 'sql.txt');
		if (storeStatic.length) {
			if (fs.existsSync(pathSql)) {
				// sql文件数据的存储格式是：文件名:最新版本号，使用管道符进行分隔
				// a.js:1|b.css:2
				fs.readFile(pathSql, 'utf8', function(err, data) {
					var arrData = data.split('|');
					arrData.forEach(function(filename_version) {
						var arrFn_vs = filename_version.split(':');
						if (arrFn_vs.length == 2) {
							// 补充静态资源的版本数据
							storeStatic.forEach(function(obj) {
								if (obj.filename == arrFn_vs[0]) {
									obj.version = arrFn_vs[1];
								}
							});
						}
					});

					// 全局更新
					self.storeStatic = storeStatic;

					// 检测文件是否有变更
					self.fileIsChanged();
				});
			} else {
				self.log('没有找到sql.txt，首次编译，JS/CSS认为最新');

				self.fileIsChanged();
			}
		} else {
			// 如果没有外联的js, css
			self.HTMLbuild();
		}
  	},

  	// 静态存储数据
  	storeStatic: [],

  	// 检测静态文件是否发生修改
  	fileIsChanged: function () {
  		var self = this;

  		// JSON配置信息
  		var jsonConfig = self.jsonConfig;
  		var jsonProjectSelected = self.jsonProjectSelected;
  		// 静态资源信息（包含当前版本）
  		var storeStatic = self.storeStatic;
  		// 项目资源目录
  		var dirRoot = jsonProjectSelected.directory;
  		var tapdid = jsonProjectSelected.tapdid;
		// 目标路径
		var dirProject = path.join(dirRoot, tapdid, 'src');

  		storeStatic.forEach(function(obj) {
			var pathOrigin = '', pathVersion = '';

			if (!obj.version) {
				obj.isModify = true;
				obj.version = 1;
				return;
			}

			// 两个文件的文件路径
			// 通过对比内容字符串是否一致判断
			if (/css$/.test(obj.filename)) {
				pathOrigin = path.join(dirProject, 'css', obj.filename);
				pathVersion = path.join(dirProject, 'css', obj.filename.replace('.css', '.' + obj.version + '.css'));

				if (self.CSSclassNameReplace(fs.readFileSync(pathOrigin, {
			    	encoding: 'utf8'
			    })) != fs.readFileSync(pathVersion, {
			    	encoding: 'utf8'
			    })) {
			    	obj.isModify = true;
			    	obj.version = +obj.version + 1;
			    }
			} else if (/js$/.test(obj.filename)) {
				pathOrigin = path.join(dirProject, 'js', obj.filename);
				pathVersion = path.join(dirProject, 'js', obj.filename.replace('.js', '.' + obj.version + '.js'));

				if (fs.readFileSync(pathOrigin, {
			    	encoding: 'utf8'
			    }) != fs.readFileSync(pathVersion, {
			    	encoding: 'utf8'
			    })) {
			    	obj.isModify = true;
			    	obj.version = +obj.version + 1;
			    }
			}
		});

		self.createNewfile();
  	},

  	// 创建新版本静态资源文件
  	createNewfile: function () {
  		var self = this;

  		// JSON配置信息
  		var jsonConfig = self.jsonConfig;
  		var jsonProjectSelected = self.jsonProjectSelected;
  		// 静态资源信息（包含当前版本）
  		var storeStatic = self.storeStatic;
  		// 项目资源目录
  		var dirRoot = jsonProjectSelected.directory;
  		var tapdid = jsonProjectSelected.tapdid;
		// 目标路径
		var dirProject = path.join(dirRoot, tapdid, 'src');

  		// 一些创建需要的数据，主要是依次遍历创建使用
  		var createIndex = 0, createLength = storeStatic.length;

  		// 分布执行，不走循环，保证顺序
		var step = function() {
			var obj = storeStatic[createIndex];

			// 不使用循环是为了保证顺序
			var next = function() {
				createIndex++;
				if (createIndex >= createLength) {
					// 全部遍历结束，数据存储，以及开始HTML的替换
					self.fileDataSql();
					self.HTMLbuild();
				} else {
					step();
				}
			};

			if (obj.isModify == true) {
				// 当前CSS文件地址
				var pathOrigin = '', pathVersion = '';
				// svn地址
				var svnOrigin = '', svnVersion = '';

				if (/css$/.test(obj.filename)) {
					pathOrigin = path.join(dirProject, 'css', obj.filename);
					pathVersion = pathOrigin.replace('.css', '.' + obj.version + '.css');

					// svn地址
					svnOrigin = path.join(jsonProjectSelected.svn.pathStatic, 'css', obj.filename);
					svnVersion = svnOrigin.replace('.css', '.' + obj.version + '.css');
				} else if (/js$/.test(obj.filename)) {
					pathOrigin = path.join(dirProject, 'js', obj.filename);
					pathVersion = pathOrigin.replace('.js', '.' + obj.version + '.js');
					// svn地址
					svnOrigin = path.join(jsonProjectSelected.svn.pathStatic, 'js', obj.filename);
					svnVersion = svnOrigin.replace('.js', '.' + obj.version + '.js');
				}

				// 如果文件有修改
				// 在同目录下创建，同时SVN复制一份
				fs.readFile(pathOrigin, 'utf8', function(err, data) {
					// 类名压缩CSS处理
					if (/css$/.test(obj.filename)) {
						data = self.CSSclassNameReplace(data);
					}

					// 以新名称重写CSS文件
					fs.writeFile(pathVersion, data, function() {
						self.log(pathVersion.split('/').slice(-1).join('') + '创建成功！');

						next();
					});

					// 新增的版本文件复制到SVN目录
					fs.writeFile(svnVersion, data, function() {
						self.log('成功到SVN目录：' + svnVersion);
					});
				});
			} else {
				self.log(obj.filename + '没有修改');
				next();
			}
		};

		step();
  	},

  	// 数据库文件信息更新
  	fileDataSql: function () {
  		var self = this;

  		// JSON配置信息
  		var jsonConfig = self.jsonConfig;
  		var jsonProjectSelected = self.jsonProjectSelected;
  		// 静态资源信息（包含当前版本）
  		var storeStatic = self.storeStatic;
  		// 项目资源目录
  		var dirRoot = jsonProjectSelected.directory;
  		var tapdid = jsonProjectSelected.tapdid;

  		var sql = storeStatic.map(function(obj) {
			return obj.filename + ':' + obj.version;
		}).join('|');

  		// sql文件路径
		var dirProject = path.join(dirRoot, tapdid, jsonConfig.build.pathHTML);
		if (!fs.existsSync(dirProject)) {
			fs.mkdirSync(dirProject);
		}
		var pathSql = path.join(dirProject, 'sql.txt');
		// sql数据重写
		fs.writeFile(pathSql, sql, function() {
			self.log('sql.txt: 新的版本数据存储成功！文件存放于：' + pathSql);
		});
  	},
  	seedClassName: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'],

  	// 按照序号返回类名
  	getClassName: function () {
  		var self = this;
  		
  		var seedClassName = self.seedClassName;
  		var indexClassName = self.indexClassName;

  		var length = seedClassName.length;


		var left = indexClassName % length, loop = Math.floor(indexClassName / length), repeat = loop % length;

		var className = '';

		var char1 = seedClassName[repeat].toUpperCase(), char2 = seedClassName[left].toUpperCase();

		if (loop >= length) {
			char1 = char1.toLowerCase();

		} 
		if (loop >= length * 2) {
			char2 = char1.toLowerCase();
		}
		if (loop >= length * 3) {
			console.log('超出2027数目限制，增加数字支持');
			char2 = char2 + (indexClassName - 2027);
		}

		indexClassName++;

		self.seedClassName = seedClassName;
		self.indexClassName = indexClassName;

		return char1 + char2;
  	},

  	// CSS类名压缩
  	CSSclassNameReplace: function (data) {
  		var self = this;

  		var jsonConfig = self.jsonConfig;

  		var arrClassNameIgnore = jsonConfig.compress.classIgnore;

  		if (jsonConfig.compress.className == true) {
			self.log('CSS压缩类名缓存中...');
			return data.replace(/\.[a-z][a-z0-9]*(?:\-\w+)*/gi, function(matchs) {
				matchs = matchs.replace('.', '');

				if (self.hashClassName[matchs]) {
					return '.' + self.hashClassName[matchs];
				} else if (arrClassNameIgnore.indexOf(matchs) === -1) {
					var shortName = self.getClassName();
					self.hashClassName[matchs] = shortName;
					return '.' + shortName;
				}
				return '.' + matchs;
			});
		} else {
			return data;
		}
  	},

  	// HTML压缩和处理
  	HTMLbuild: function () {
  		var self = this;

  		// JSON配置信息
  		var jsonConfig = self.jsonConfig;
  		var jsonProjectSelected = self.jsonProjectSelected;
  		// 静态资源信息（包含当前版本）
  		var storeStatic = self.storeStatic;
  		// 项目资源目录
  		var dirRoot = jsonProjectSelected.directory;
  		var tapdid = jsonProjectSelected.tapdid;
		// 目标路径
		var dirProject = path.join(dirRoot, tapdid, 'src');
		// HTML模板文件SVN地址(路径已经包含tapdid)
  		var dirSVNHTML = jsonProjectSelected.svn.pathHTML;

  		self.log('开始模板文件的处理...');

  		// 1. 静态资源地址替换
		// 2. url路径替换
		// 3. html压缩
		var dirHTML = dirProject;
		fs.readdir(dirHTML, function (err, files) {
		    // files 是一个存储目录中所包含的文件名称的数组，数组中不包括 '.' 和 '..'
		    files.forEach(function(filename) {
		    	if (/\.html$/.test(filename)) {
		    		var pathHTMLFile = path.join(dirProject, filename);
		    		fs.readFile(pathHTMLFile, 'utf8', function (err, data) {
					    if (err) {
					        throw err;
					    }

					    if (storeStatic.length) {
					    	self.log(filename + ': css/js文件名替换中...');

						    storeStatic.forEach(function(obj) {
					    		var replacedFilename = obj.filename.replace(/\.(js|css)$/, function(matchs, $1) {
						    		return '.' + obj.version + '.' + $1;
						    	});
						    	data = data.replace('/' + obj.filename, '/' + replacedFilename);
						    	self.log(obj.filename + '替换成了' + replacedFilename);
						    });
					    }

					    // 类名压缩
						if (jsonConfig.compress.className == true) {
							self.log(filename + ': 类名替换中...');
							data = data.replace(/class\s*=\s*"(.*?)"/g, function(matchs, $1) {
								//console.log($1);
								return 'class="' + $1.split(' ').map(function(className) {
									if (self.hashClassName[className]) {
										return self.hashClassName[className];
									}
									return className;
								}).join(' ') + '"';
							})
						}

					    // 这里build/public和build下HTML并联进行，之前是串联
					    var pathReplace = jsonConfig.pathReplace;
					    // 先是public替换
					    // {from: '', to: ''}
					    var pathReplacePublic = pathReplace.public;
					    // build下index.html替换
					    var pathReplaceBuild = pathReplace.build;

					    // 数据也分开
					    var dataPublic = data;

					    // public下的HTML页面非压缩版本
					    var dirPublic = path.join(dirRoot, tapdid, jsonConfig.build.pathHTML, 'public');
					    if (!fs.existsSync(dirPublic)) {
					    	self.log('public文件夹不存在，新建之');
							fs.mkdirSync(dirPublic);
						}

					    // public/index.html相对地址替换
					    self.log('public/'+ filename +': 相对地址更换中...');

					    var regPublic = new RegExp(pathReplacePublic['from'].replace(/\./g, '\\.').replace(/\//g, '\\/'), 'g');
					    dataPublic = dataPublic.replace(regPublic, pathReplacePublic['to']);

					    // 写入public页面
					    fs.writeFileSync(path.join(dirPublic, filename), dataPublic);
					    self.log('public/' + filename + ': 生成成功，点击<a href="'+ path.join(dirPublic, filename) +'" class="blue" target="_blank">这里</a>预览！');
					    
					    // 这是要上线的静态页面处理
					    var reg = new RegExp(pathReplaceBuild['from'].replace(/\./g, '\\.').replace(/\//g, '\\/'), 'g');
					    data = data.replace(reg, pathReplaceBuild['to']);

					    // 几乎不存在不需要分享的专题，因此，内置
					    var insertHTML = '<script src="'+ jsonConfig.protocol +'//qidian.gtimg.com/acts/ywurl/ywurl1.0.1.js"></script><script>document.body.onclick=function(c){c=c||window.event;var e=c.target;var a=function(h){if(!h){return null}var g=h.tagName.toLowerCase();if(g=="a"){return h}else{if(g=="body"){return null}else{return a(h.parentNode)}}};var d=a(e);var b=d&&d.getAttribute("data-bookid");if(b&&window.ywurl){var f=b.split(/\\s*,\\s*/);if(f.length==2){ywurl.book({qdId:f[0],csId:f[1]});return false}}};</script>';

					    if (jsonConfig.share.img_url) {
					    	self.log(filename + ': 正在写入分享...');
					    	// 微信分享
					    	insertHTML = insertHTML + 
					    	'<script>' +
					    	'var config_share = {\
	    img_url: "'+ jsonConfig.share.img_url +'",\
	    link: location.href,\
	    desc: "'+ jsonConfig.share.desc +'",\
	    title: "'+ jsonConfig.share.title +'"\
	};' +	
							'config_share.img=config_share.img_url;config_share.url=config_share.link;\
							var eleShareBtns = document.querySelectorAll("'+ jsonConfig.shareSelector +'");\
	if(eleShareBtns.length && (ywurl.uA == ywurl.platforms.iosApp || ywurl.uA == ywurl.platforms.androidApp)){\
		[].slice.call(eleShareBtns).forEach(function(ele) {\
			ele.addEventListener("click", function () { ywurl.yuewenShare.share(config_share); });\
		});\
	}else{ ywurl.yuewenShare.setShareConfig(config_share); }' +
							'</script>';
					    }

					    // ta统计
					    if (jsonConfig.domain && jsonConfig.ta[jsonConfig.domain]) {
					    	self.log(filename + ': 正在写入ta统计...');
					    	insertHTML = insertHTML + '<script>var _mtac = {};(function() {var mta = document.createElement("script");mta.src = "'+ jsonConfig.protocol +'//pingjs.qq.com/h5/stats.js?v2.0.4";mta.setAttribute("name", "MTAH5");mta.setAttribute("sid", "'+ jsonConfig.ta[jsonConfig.domain] +'");var s = document.getElementsByTagName("script")[0];s.parentNode.insertBefore(mta, s);})();</script>';
					    }

					    // 插入在页面底部
					    data = data.replace('</body>', insertHTML + '</body>');

					    // 开始压缩
					    if (jsonConfig.compress.html) {
				        	self.log(filename + ': 开始创建压缩版本');

					        var minidata = minify(data, {
						    	removeComments: true,
						    	collapseWhitespace: true,
						    	minifyJS:true, 
						    	minifyCSS:true
						    });

					        // 根目录最终发布HTML生成
					        var pathHTMLMini = path.join(dirRoot, tapdid, jsonConfig.build.pathHTML, filename);
					        var pathSVNHTMLMini = path.join(dirSVNHTML, filename);

						    fs.writeFile(pathHTMLMini, minidata, function() {
						        self.log(filename + ': 压缩成功，点击<a href="'+ pathHTMLMini +'" class="blue" target="_blank">这里</a>预览！');
						        // svn目录转移
						        if (dirSVNHTML) {
						        	fs.writeFile(pathSVNHTMLMini, minidata, function() {
						        		self.log('成功到SVN目录：点击<a href="'+ pathSVNHTMLMini +'" class="blue" target="_blank">这里</a>预览！');
						        		
						        		self.log('任务完成！<a href="javascript:" class="blue closeDialog">点此</a>关闭弹框。');
						        	});
						        } else {
						        	self.log('任务完成！<a href="javascript:" class="blue closeDialog">点此</a>关闭弹框。');
						        }				        
						    });
				        }
					});
		    	}
		    });
		});
  	},

  	svg: function () {
  		var urlSVG = path.join(__dirname, 'symbol-defs.svg');

  		var htmlSVG = fs.readFileSync(urlSVG, {
	    	encoding: 'utf8'
	    });

	    // 插入到页面
	    if (htmlSVG) {
	    	document.body.insertAdjacentHTML('afterbegin', htmlSVG);
	    }
  	},

  	contextmenu: function () {
  		var menu = new Menu();

  		menu.append(new MenuItem({
			label: '剪切',
			role: 'cut'
		}));
		menu.append(new MenuItem({
			label: '复制',
			role: 'copy'
		}));
		menu.append(new MenuItem({
			label: '粘贴',
			role: 'paste'
		}));
		menu.append(new MenuItem({
			label: '全选',
			role: 'selectall'
		}));
		menu.append(new MenuItem({type: 'separator'}));
		menu.append(new MenuItem({
			label: '刷新',
			role: 'reload'
		}));
		menu.append(new MenuItem({
			label: '强刷',
			role: 'forcereload'
		}));

		window.addEventListener('contextmenu', function (event) {
			event.preventDefault();
		  	menu.popup(remote.getCurrentWindow());
		}, false)
  	},

  	getHttpsData: function (filepath, success, error) {
  		// 回调缺省时候的处理
  		success = success || function () {};
  		error = error || function () {};

  		var url = 'https://raw.githubusercontent.com/yued-fe/bobo-electron/master/' + filepath + '?r=' + Math.random();

  		https.get(url, function (res) {
  			var statusCode = res.statusCode;

  			if (statusCode !== 200) {
  				$.lightTip.error(filepath + '获取失败，错误码' + statusCode);
  				// 出错回调
    			error();
    			// 消耗响应数据以释放内存
    			res.resume();
    			return;
  			}

  			res.setEncoding('utf8');
  			var rawData = '';
		  	res.on('data', function (chunk) {
		    	rawData += chunk;
		  	});

		  	// 请求结束
		  	res.on('end', function () {
			    success(rawData);
			}).on('error', function (e) {
			  	$.lightTip.error('发生错误：' + e.message);
  				// 出错回调
    			error();
			});
		});
  	},

  	updateDetect: function () {
  		var self = this;

  		var elDetect = $('#configDetect');
  		// 出错时候的统一处理
  		var errorDetect = function () {
  			elDetect.html('<span class="red">检测失败</span>');
  		};

  		// 0.0.00这种版本转换为可直接比较的内容
  		String.prototype.version = function () {
  			return this.split('.').map(function (seed) {
		    	if (seed.length == 1) {
		    		seed = '0' + seed;
		    	}
		    	return seed;
		    }).join('');
  		};

  		// 1. 获取github远程的package.json数据
  		self.getHttpsData('package.json', function (strJSONRemotePackage) {
  			// string to JSON
  			try {
		      	var jsonRemotePackage = JSON.parse(strJSONRemotePackage);
		    } catch (e) {
		      	$.lightTip.error('远程package.json解析异常：' + e.message);
		      	errorDetect();
		      	return;
		    }

		    // 读取本地
		    var pathLocalPackage = path.join(__dirname, 'package.json');
	  		// 对比本地版本和线上版本
	  		var strJSONLocalPackage = fs.readFileSync(pathLocalPackage, 'utf8');
	  		// string to JSON
  			try {
		      	var jsonLocalPackage = JSON.parse(strJSONLocalPackage);
		    } catch (e) {
		      	$.lightTip.error('本地package.json解析异常：' + e.message);
		      	errorDetect();
		      	return;
		    }

		    // 版本比对
		    var versionLocal = jsonLocalPackage.version;
		    var versionRemote = jsonRemotePackage.version;

		    if (versionLocal.version() < versionRemote.version()) {
		    	// 求得当前对应版本的一些数据（升级文件序列，升级描述）
		    	var manifest = jsonRemotePackage.manifest;
		    	var objTargetVersion = null;
		    	manifest.forEach(function (obj) {
	    			if (obj.version == versionRemote) {
	    				objTargetVersion = obj;
	    			}
	    		});

	    		if (!objTargetVersion) {
	    			elDetect.html('信息异常，当前版本v'+ versionLocal +'无法升级');
	    			return;
	    		}

		    	elDetect.html('<span id="updateInfo">可升级到v'+ versionRemote +'（<a href="javascript:" id="newVersionView" class="blue">新版功能</a>）</span><a href="javascript:" id="newVersionGet" class="ui-button ui-button-warning" role="button">升级</a>');

		    	// 事件-查看新版功能
		    	$('#newVersionView').on('click', function () {
		    		var htmlDialogVersion = '<p class="update-log-v"><strong>已装：</strong>v'+ versionLocal +'<strong class="ml20">升级：</strong><span class="orange">v'+ versionRemote +'</span></p>';
		    		// 获取升级版本的detail详细信息
		    		var arrDetail = objTargetVersion.detail;

		    		if (arrDetail.length == 0) {
		    			arrDetail = ['修复一些已知的问题'];
		    		}

	    			htmlDialogVersion = htmlDialogVersion + '<ol class="update-log">' + arrDetail.map(function (text) {
	    				return '<li>'+ text +'</li>';
	    			}).join('') + '</ol>';

	    			// 弹框
	    			new Dialog({
	    				title: '新版功能',
	    				content: htmlDialogVersion,
	    				width: 440,
	    				buttons: [{}]
	    			});
		    	});

		    	// 事件-升级
		    	var elProgress = $('#updateProgress');
		    	// 详细升级信息提示
		    	var elInfo = $('#updateInfo');
		    	// 临时文件夹目录
		    	var dirUpdate = path.join(__dirname, versionRemote);
		    	// 点击升级按钮
		    	$('#newVersionGet').on('click', function () {
		    		var elBtn = $(this);
		    		if (elBtn.isLoading()) {
		    			return;
		    		}

		    		var arrFile = objTargetVersion.file;

		    		// package.json是必须的
		    		if (arrFile.indexOf('package.json') == -1) {
		    			arrFile.unshift('package.json');
		    		}

		    		// 文件个数，进度条长度
		    		var length = arrFile.length;
		    		var width = elProgress.width();

		    		var start = 0;

		    		var progress = function (widthProgress) {
		    			var percent = start / length;
		    			var widthProgress = widthProgress || width * percent;
		    			elProgress.css('clip-path', 'polygon(0 0, '+ widthProgress +'px 0, '+ widthProgress +'px 1px, 0 1px)');
		    		};

		    		var step = function () {
		    			var filepath = arrFile[start];
		    			if (filepath) {
		    				filepath = filepath.replace(/^\.\//, '');

		    				// 升级信息更新
		    				elInfo.html(filepath + '获取中...');

		    				// 进度条跟上
		    				if (start == 0) {
		    					progress(20);
		    				}

		    				// 建立以版本号为名称的临时文件夹
	    					if (!fs.existsSync(dirUpdate)) {
	    						fs.mkdirSync(dirUpdate);
	    					}

		    				// 之前已经获得，直接写入
		    				if (filepath == 'package.json') {
		    					// 写入文件
		    					fs.writeFileSync(path.join(dirUpdate, filepath), strJSONRemotePackage);
		    					// 进度更新
		    					start++;
		    					progress();
		    					// 下一个文件
		    					step();
		    					return;
		    				}

		    				// 获取文件内容
		    				self.getHttpsData(filepath, function (data) {
		    					// 如果更新文件路径较深，例如'src/css/style.css'
		    					var arrFilepath = filepath.split('/');
		    					if (arrFilepath.length > 1) {
		    						arrFilepath.pop();
		    						// 深度创建文件资源
		    						self.createPath(path.join(dirUpdate,  arrFilepath.join('/')));
		    					}
		    					// 写入文件
		    					fs.writeFileSync(path.join(dirUpdate, filepath), data);
		    					// 进度更新
		    					start++;
		    					progress();
		    					// 下一个文件
		    					step();
		    				}, function () {
		    					elInfo.html('<span class="red">'+ filepath + '获取失败</span>');
		    					// 按钮状态还原
		    					elBtn.html('重试').unloading();
		    					// 进度还原
		    					elProgress.removeAttr('style');
		    				});
		    			} else {
		    				elInfo.html('资源全部获取完毕，更新中...');
		    				// 认为近似结束了
		    				progress(width - 20);
		    				// 最后20px进度是用来资源覆盖

		    				self.copy(dirUpdate, __dirname);

		    				progress(width);

		    				setTimeout(function () {
		    					elInfo.html('<span class="green">升级成功，重载中...</span>');
		    					location.reload();
		    				}, 250);
		    			}
		    		};

		    		elBtn.loading();

		    		step();
		    	});

		    } else {
		    	elDetect.html('当前v'+ versionLocal +'已经是最新版本');
		    	setTimeout(function () {
		    		elDetect.html('v' + versionLocal);
		    	}, 3000);
		    }
  		}, errorDetect);		
  	},

  	init: function () {
	    this.eventFooterFixed();

	    // 新建项目
	    this.eventCreateProject();
	    // 编辑项目
	    this.eventEditProject();

	    // 右侧表单初始化
	    this.initFormElements();

	    // 获取项目数据
	    this.getProject();

	    // 左侧项目切换交互
	    this.eventAside();

	    // 图标
	    this.svg();

	    // 右键上下文
	    this.contextmenu();

	    // 版本检测
	    this.updateDetect();
  	}  	
}).init();  