/*
 * hr系统原型开发node.js脚本
 * 1. 实时CSS合并;
 * 2. 实时JS合并；
 * 3. 实时html编译;
*/

const fs = require('fs');
stat = fs.stat;

const path = require('path');
const url = require('url');

/*
** qCss CSS快速书写
** @params src qcss原始文件所在目录
** @params dist 生成CSS文件所在目录
*/

let qCss = function (src, dist) {
  // key转换
  var keyMap = {
    dn: 'display: none',
    di: 'display: inline',
    dib: 'display: inline-block',
    db: 'display: block',
    dt: 'display: table',
    dtc: 'display: table-cell',
    m: 'margin: ',
    ml: 'margin-left: ',
    mt: 'margin-top: ',
    mr: 'margin-right: ',
    mb: 'margin-bottom: ',
    ma: 'margin: auto',
    mla: 'margin-left: auto',
    mra: 'margin-right: auto',
    p: 'padding: ',
    pl: 'padding-left: ',
    pt: 'padding-top: ',
    pr: 'padding-right: ',
    pb: 'padding-bottom: ',
    l: 'float: left',
    r: 'float: right',
    bg: 'background: ',
    bgc: 'background-color: ',
    bgi: 'background-image: ',
    bgr: 'background-repeat: ',
    bgp: 'background-position: ',
    c: 'color: ',
    bd: 'border: ',
    bdl: 'border-left: ',
    bdr: 'border-right: ',
    bdt: 'border-top: ',
    bdb: 'border-bottom: ',
    br: 'border-radius: ',
    bbb: 'box-sizing: border-box',
    o: 'outline: ',
    f: 'font-size: ',
    ff: 'font-family: ',
    fs: 'font-style: ',
    fw: 'font-weight: ',
    b: 'font-weight: bold',
    i: 'font-style: italic',
    n: 'font-weight: normal; font-style: normal',
    tdl: 'text-decoration: underline',
    tdn: 'text-decoration: none',
    tc: 'text-align: center',
    tl: 'text-align: left',
    tr: 'text-align: right',
    tj: 'text-align: justify',
    cl: 'clear: both',
    abs: 'position: absolute',
    rel: 'position: relative',
    fix: 'position: fixed',
    op: 'opacity: ',
    z: 'zoom: ',
    zx: 'z-index: ',
    h: 'height: ',
    w: 'width: ',
    lh: 'line-height: ',
    v: 'vertical-align: ',
    vt: 'vertical-align: top',
    vm: 'vertical-align: middle',
    vb: 'vertical-align: bottom',
    poi: 'cursor: pointer',
    def: 'cursor: default',
    ovh: 'overflow: hidden',
    ova: 'overflow: auto',
    vh: 'visibility: hidden',
    vv: 'visibility: visible',
    prew: 'white-space: pre-wrap',
    pre: 'white-space: pre',
    nowrap: 'white-space: nowrap',
    bk: 'word-break: break-all',
    bkw: 'word-wrap: break-word',
    ws: 'word-spacing: ',
    ls: 'letter-spacing: ',
    a: 'animation: ',
    tsf: 'transform: ',
    tsl: 'transition: ',
    bs: 'box-shadow: ',
    ts: 'text-shadow: ',
    center: 'position: absolute; top: 0; bottom: 0; right: 0; left: 0; margin: auto',
    ell: 'text-overflow: ellipsis; white-space: nowrap; overflow: hidden',
    clip: 'position: absolute; clip: rect(0 0 0 0)'
  };

  var valueMap = {
    s: 'solid',
    d: 'dashed',
    tt: 'transparent',
    cc: 'currentColor',
    n: 'normal',
    c: 'center',
    rx: 'repeat-x',
    ry: 'repeat-y',
    no: 'no-repeat',
    ih: 'inherit',
    l: 'left',
    t: 'top',
    r: 'right',
    b: 'bottom'
  };

  fs.readdirSync(src).forEach(function (filename) {
		if (/\.qcss$/.test(filename)) {
			// .qcss文件才处理
			// 读文件内容
			fs.readFile(path.join(src, filename), {
		        // 需要指定编码方式，否则返回原生buffer
		        encoding: 'utf8'
		    }, function (err, data) {
			      // 计算出文件中设置的隐射
			      let valueMapCustom = {};

			      data.replace(/\/\*([\w\W]*?)\*\//, function (matchs, $1) {
			        $1.split(';').forEach(function (parts) {
			          let needPart = parts.split('$')[1];
			          if (needPart && needPart.split('=').length == 2) {
			            let keyValue = needPart.split('=');
			            if (keyValue[1].trim() && keyValue[0].trim()) {
			              valueMapCustom[keyValue[0].trim()] = keyValue[1].trim();
			            }
			          }
			        });
			      });

			      let dataReplace = data.replace( /\{([\w\W]*?)\}/g, function (matchs, $1) {
			      	let space = '    ';
			        let prefix = '{\n' + space, suffix = '\n}';
			        // 查询语句处理
			        if (/\{/.test($1)) {
			        	suffix = '\n' + space + '}';
			        	space = space + space;
			          prefix = '{' + $1.split('{')[0] + '{\n' + space;

			          $1 = $1.split('{')[1];
			        }
			        // 替换
			        // 分号是分隔符
			        return prefix + $1.split(';').map(function (state) {
			          state = state.trim();
			          if (!state) {
			            return '';
			          }
			          if (state.indexOf(':') != -1) {
			            return state;
			          }
			          return state.replace(/^([a-z]+)(.*)$/g, function (matchs, key, value) {
			            // 值主要是增加单位，和一些关键字转换
			            value = (value || '').split(' ').map(function (parts) {
			              parts = parts.trim();
			              if (!parts) {
			                return '';
			              }

			              if (!isNaN(parts)) {
			                // 数值自动加px单位
			                if (key == 'lh' && parts < 5) {
			                	return parts;
			                } else if (/^(?:zx|op|z|fw)$/.test(key) == false && parts != '0') {
			                  parts = parts + 'px';
			                }
			              } else if (key == 'tsl') {
			                parts = (keyMap[parts] || parts).replace(':', '').trim();
			              } else if (key != 'a') {
			                // CSS动画不对值进行替换
			                parts = valueMapCustom[parts] || valueMap[parts] || parts;
			              }

			              return parts;
			            }).join(' ');

			            // 键转换
			            key = keyMap[key] || key + ': ';

			            return key + value.trim();
			          });
			        }).join(';\n' + space).trim() + suffix;
			      });

		        // 于是生成新的CSS文件
		        let newFilename = filename.replace('.qcss', '.css');
		        fs.writeFile(path.join(dist, newFilename), dataReplace, {
		            encoding: 'utf8'
		        }, function () {
		            console.log(newFilename + '生成成功！');
		        });
		    });
		}
	});
};

const pathSrcQcss = './qcss/';
const pathDistQcss = './css/';

// 任务
const task = {
	qcss: {
		init: function () {
			// 资源清理
			qCss(pathSrcQcss, pathDistQcss);
		}
	}
};


// 一开始第一次任务
for (var keyTask in task) {
	task[keyTask].init();
}

let timerCommonCSS;
fs.watch(pathSrcQcss, (eventType, filename) => {
	// 定时器让多文件同时变更只会只会执行一次合并
	clearTimeout(timerCommonCSS);
	console.log(filename + '发生了' + eventType + '变化，正在编译...');
	timerCommonCSS = setTimeout(() => {
		task.qcss.init();
	}, 100);
});