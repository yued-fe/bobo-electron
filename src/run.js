/*
 * QCSS实时编译加速书写小工具
*/

const fs = require('fs');
stat = fs.stat;

const path = require('path');
const url = require('url');

const https = require('https');

// 两个qcss运行需要的模块
const moduleQcssMap = 'qcss-map';
const moduleQcssWeb = 'qcss-web';

const pathSrcQcss = './qcss/';
const pathDistQcss = './css/';

/**
 * 异步在线获取qcss模块的方法
 * @param  {[type]} filepath [description]
 * @return {[type]}          [description]
 */
async function getHttpsData (filepath) {
    return await new Promise((resolve, reject) => {
        var url = 'https://raw.githubusercontent.com/zhangxinxu/gulp-qcss/master/' + filepath;

        console.log('正在获取' + filepath + '数据...');

        https.get(url, function (res) {
            var statusCode = res.statusCode;

            if (statusCode !== 200) {
                console.error(filepath + '获取失败，错误码' + statusCode);
                // 出错回调
                reject();
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
                resolve(rawData);
            }).on('error', function (e) {
                console.error('发生错误：' + e.message);
                // 出错回调
                reject();
            });
        });
    });
};

// 判断模块是否存在
async function moduleRequire () {
    let filenameQcssMap = moduleQcssMap + '.js';
    let filenameQcssWeb = moduleQcssWeb + '.js';

    let dataQcssMap = '';
    let dataQcssWeb = '';

    // 如果本地没有模块，则在线获取
    if (!fs.existsSync(filenameQcssMap)) {
        dataQcssMap = await getHttpsData(filenameQcssMap);
        // 写入
        fs.writeFileSync(filenameQcssMap, dataQcssMap, {
            encoding: 'utf8'
        });
    }
    if (!fs.existsSync(filenameQcssWeb)) {
        dataQcssWeb = await getHttpsData(filenameQcssWeb);
        // 写入
        fs.writeFileSync(filenameQcssWeb, dataQcssWeb, {
            encoding: 'utf8'
        });
    }

    let qcss = require('./qcss-web');

    /*
    ** qCss CSS快速书写
    ** @params src qcss原始文件所在目录
    ** @params dist 生成CSS文件所在目录
    */

    let qcss2css = function (src, dist) {
        fs.readdirSync(src).forEach(function (filename) {
            if (/\.qcss$/.test(filename)) {
                // .qcss文件才处理
                // 读文件内容
                fs.readFile(path.join(src, filename), {
                    // 需要指定编码方式，否则返回原生buffer
                    encoding: 'utf8'
                }, function (err, data) {
                     let dataReplace = qcss(data);

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

    // 任务
    const task = {
        qcss: {
            init: function () {
                // 资源清理
                qcss2css(pathSrcQcss, pathDistQcss);
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
        timerCommonCSS = setTimeout(() => {
            console.log(filename + '发生了' + eventType + '变化，正在编译...');
            task.qcss.init();
        }, 100);
    });
};

moduleRequire();
