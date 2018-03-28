/*!
 * @Author: liyl@loocon.com & guanzy@loocon.com
 * @Date: 2014/11/12
 * @Describe: 微信语音接口
 */

define('voice',['weixin'],function(require, exports) {
    var weixin = require('weixin');

    var isReady = false,    // SDK 就绪状态
        callQueue = [];     // 等待执行的函数

    // 绑定函数队列
    var bindQueue = function(callback) {
        return function() {
            var arg = [].slice.call(arguments);

            if(isReady){
                callback.apply(null, arg);
            } else {
                callQueue.push(function() {
                    callback.apply(null, arg);
                });
            }
            return this;
        }
    };

    // 微信就绪
    weixin.ready(function() {
        isReady = true;
        while(callQueue.length) {
            callQueue.shift()();
        }
    });

    return {
        // 开始录音
        startRecord: bindQueue(function() {
            weixin.startRecord();
        }),

        // 停止录音
        stopRecord: bindQueue(function(callback) {
            weixin.stopRecord({
                success: function (res) {
                    callback(res.localId);  // 返回音频的本地ID
                }
            });
        }),

        // 监听录音自动停止
        onVoiceRecordEnd: bindQueue(function(callback) {
            weixin.onVoiceRecordEnd({
                // 录音时间超过一分钟没有停止的时候会执行 complete 回调
                complete: function (res) {
                    callback(res.localId);  // 返回音频的本地ID
                }
            });
        }),

        // 播放语音
        playVoice: bindQueue(function(localId) {
            weixin.playVoice({
                localId: localId // 需要播放的音频的本地ID，由stopRecord接口获得
            });
        }),

        // 暂停播放
        pauseVoice: bindQueue(function(localId) {
            weixin.pauseVoice({
                localId: localId // 需要暂停的音频的本地ID，由stopRecord接口获得
            });
        }),

        // 停止播放
        stopVoice: bindQueue(function(localId) {
            weixin.stopVoice({
                localId: localId // 需要停止的音频的本地ID，由stopRecord接口获得
            });
        }),

        // 监听语音播放完毕
        onVoicePlayEnd: bindQueue(function(callback) {
            weixin.onVoicePlayEnd({
                success: function (res) {
                    callback(res.localId);  // 返回音频的本地ID
                }
            });
        }),

        // 上传语音
        uploadVoice: bindQueue(function(localId, callback) {
            weixin.uploadVoice({
                localId: localId, // 需要上传的音频的本地ID，由stopRecord接口获得
                isShowProgressTips: 1, // 默认为1，显示进度提示
                success: function (res) {
                    callback(res.serverId);  // 返回音频的服务器端ID
                }
            });
        }),

        // 下载语音
        downloadVoice: bindQueue(function(serverId, callback) {
            weixin.downloadVoice({
                serverId: serverId, // 需要下载的音频的服务器端ID，由uploadVoice接口获得
                isShowProgressTips: 1, // 默认为1，显示进度提示
                success: function (res) {
                    callback(res.localId);  // 返回音频的本地ID
                }
            });
        }),

        // 识别音频并返回识别结果
        translateVoice: bindQueue(function(localId, callback) {
            weixin.translateVoice({
                localId: localId, // 需要识别的音频的本地Id，由录音相关接口获得
                isShowProgressTips: 1, // 默认为1，显示进度提示
                success: function (res) {
                    callback(res.translateResult); // 语音识别的结果
                }
            });
        })
    }
});