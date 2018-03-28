/**
 * @Author: liyuelong1020@gmail.com
 * @Date: 15-4-2
 * @Describe: 表单验证手机版
 *
 * @ from.isCheck([tip])  检查表单是否通过验证[boolean]，参数tip： 是否显示提示信息
 * @ form.bindCheck([event]) 绑定即时验证，参数 event：可选，默认触发事件为 change
 * 例如：<input type="text" data-validate="empty,email"/>
 *
 * 需要验证的表单元素需要添加属性 data-validate，以下元素不在验证范围内：['submit', 'reset', 'button', 'hidden', undefined]
 * data-validate 属性格式
 *     验证单一格式：data-validate="empty"
 *     验证多个格式：data-validate="empty,email"
 *     验证是否符合其中一个：data-validate="phone|email"
 *     多个规则组合验证： data-validate="empty,phone|email"
 *
 * data-validate 属性值
 *     empty：验证非空
 *     email：验证电子邮件
 *     phone：验证手机号码
 *     tell：验证固话
 *     number：验证数字
 *     integer：验证整数
 *     url：验证网址
 *     password：验证密码
 *     cn：验证中文
 *     plus：验证正整数
 *     checkval：验证值是否与其他表单元素相同，
 *              使用方法： checkval([selector]) selector为表单元素选择器
 *              例如 data-validate="checkval([name='password'])"
 *     len：验证值的长度
 *              使用方法： len([number])
 *              例如 data-validate="len(11)"
 *     minlen：验证值的最小长度
 *              使用方法： minlen([number])
 *              例如 data-validate="minlen(1)"
 *     maxlen：验证值的最大长度
 *              使用方法： maxlen([number])
 *              例如 data-validate="maxlen(20)"
 *     regexp：自定义验证规则
 *              使用方法： regexp([regexp string])
 *              例如 data-validate="regexp(\d+)"
 */

define('validate',[],function() {

    // 表单验证提示信息
    var lang = {
        'empty': '不能为空！',
        'email': '电子邮箱格式错误！',
        'phone': '手机号码格式错误！',
        'tell': '电话号码格式错误！',
        'number': '请输入数字！',
        'integer': '请输入整数！',
        'url': '请输入正确的网址！',
        'password': '密码格式错误，请输入6到18个字符！',
        'checkval': '两次输入的密码不一致！',
        'error': '格式错误！',
        'register': '该账号已经注册！',
        'verify': '验证码错误！',
        'cn': '请输入中文！',
        'len': '长度不符！',
        'minlen': '长度不够！',
        'maxlen': '长度太长！',
        'regexp': '格式不符！',
        'succeed': 'OK！'
    };

    // 文本格式验证正则表达式
    var regex = {
        email: /^(\w)+(\W\w+)*@(\w)+(-\w+)*((\.\w+)+)$/,             // email
        phone: /^1[3|4|5|7|8][0-9]\d{8,8}$/,                         // 手机号码
        tell: /\d{3}-\d{8}|\d{4}-\d{7,8}/,                           // 固话
        number: /^[\-\+]?((\d+)([\.,](\d+))?|([\.,](\d+))?)$/,       // 数字
        integer: /^\d+$/,                                            // 整数
        date: /^\d{4}\W\d{1,2}\W\d{1,2}$/,                           // 日期
        time: /^\d{1,2}:\d{1,2}$/,                                   // 时间
        cn: /^[^u4e00-u9fa5\w~!@#$%^&*()_+{}:"<>?\-=[\];\',.\/]+$/ig,// 中文
        plus: /^[\+]?((\d+)([\.,](\d+))?|([\.,](\d+))?)$/,           // 正数
        url: /^[a-zA-z]+:\/\/(\w+(-\w+)*)(\.(\w+(-\w+)*))*/,         // 链接
        password: /^[\w~!@#$%^&*()_+{}:"<>?\-=[\];\',.\/]{6,18}$/    // 密码
    };

    // 表单验证规则
    var testRule = {
        // 验证为空
        empty: function(elem) {
            return !!elem.v_get_val();
        },
        // 验证重复密码
        checkval: function(elem, selector) {
            var val = elem.v_get_val();
            var passwordElem = elem.form.querySelector(selector);
            return !passwordElem || val === passwordElem.value;
        },
        // 验证固定长度
        len: function(elem, len) {
            return elem.v_get_val().length === (Number(len) || 1);
        },
        // 验证最小长度
        minlen: function(elem, len) {
            return elem.v_get_val().length >= (Number(len) || 0);
        },
        // 验证最大长度
        maxlen: function(elem, len) {
            return elem.v_get_val().length <= (Number(len) || 18);
        },
        // 自定义验证规则
        regexp: function(elem, rule) {
            var regexp = new RegExp(rule, 'g');
            return regexp.test(elem.v_get_val());
        }
    };
    // 验证文本
    ['email', 'phone', 'tell', 'number', 'integer', 'date', 'time', 'cn', 'plus', 'url', 'password'].forEach(function(rule) {
        testRule[rule] = function(elem) {
            return !elem.v_get_val() || regex[rule] && regex[rule].test(elem.v_get_val());
        };
    });

    // 表单元素验证方法
    var checkMethod = function(elem) {
        var errorRule = 'succeed', isChecked;

        // 验证结果
        isChecked = elem.v_rules.every(function(ruleObj) {
            var checkResult;
            if(Array.isArray(ruleObj) && ruleObj.length){
                checkResult = ruleObj.some(function(ruleSubObj) {
                    return !testRule[ruleSubObj.rule] || testRule[ruleSubObj.rule](elem, ruleSubObj.param);
                });
                errorRule = checkResult ? 'succeed' : ruleObj[0].rule;
            } else {
                checkResult = !testRule[ruleObj.rule] || testRule[ruleObj.rule](elem, ruleObj.param);
                errorRule = checkResult ? 'succeed' : ruleObj.rule;
            }

            return checkResult;
        });

        // 将验证结果保存为表单元素属性
        elem.v_is_checked = isChecked;

        return {
            isChecked: isChecked,
            errorRule: errorRule
        };
    };

    // 分解规则与参数
    var getRuleParam = function(rule) {
        var params = /^(\w+)\((.*)\)$/g.exec(rule);
        if(params && params.length === 3){
            return {
                rule: params[1],
                param: params[2]
            };
        } else {
            return {
                rule: rule,
                param: null
            };
        }
    };

    // 获取验证规则
    var getCheckRule = function(rules) {

        // 获取需要验证的规则
        var ruleStr = rules.split(',').filter(function(item) {
            return !!item;
        });

        // 获取可选验证规则数组
        var ruleArr = ruleStr.map(function(item) {
            var rule = item.split('|').filter(function(item) {
                return !!item;
            });
            return rule.length == 1 ? rule[0] : rule;
        });

        return ruleArr.map(function(item) {
            if(Array.isArray(item)){
                return item.map(function(subItem) {
                    return getRuleParam(subItem);
                });
            } else {
                return getRuleParam(item);
            }
        });
    };

    // 不需要验证的元素
    var noValidateElement = ['submit', 'reset', 'button', 'hidden', undefined];

    // 获取需要验证的元素并绑定取值方法
    var getValidateElement = function(elements) {

        // 获取需要验证的元素
        var validateElem = [].slice.call(elements).filter(function(elem) {
            return noValidateElement.indexOf(elem.type) < 0 && !elem.disabled && !!elem.getAttribute('data-validate');
        });

        validateElem.forEach(function(elem) {

            // 绑定取值方法
            elem.v_get_val = (function(){
                var type = elem.type;
                if(/radio|checkbox/ig.test(type)) {
                    // 单选/复选框
                    var name = elem.name, elements;
                    if(name){
                        elements = [].slice.call(elem.form[name]);
                        return function() {
                            return elements.some(function(input) {
                                return input.checked;
                            });
                        };
                    } else {
                        return function() {
                            return this.checked;
                        }
                    }
                } else {
                    // 文本框
                    return function() {
                        return this.value;
                    }
                }
            })();

            // 获取验证规则   {rule:[验证规则], param:[规则参数]}
            elem.v_rules = getCheckRule(elem.getAttribute('data-validate'));

        });

        return validateElem;
    };

    // 检查是否通过验证
    var isCheck = function(tip) {
        var form = this;
        // 需要验证的表单元素
        var elements = getValidateElement(form.elements);

        // 将需要验证的元素保存至表单属性
        form.validateElements = elements;

        // 验证表单元素
        return elements.every(function(elem) {
            var result = checkMethod(elem);
            if(!!tip){
                form.validateTip(elem, result.errorRule, lang[result.errorRule]);
            }
            return result.isChecked;
        });
    };

    // 绑定即时验证
    var bindCheck = function(event) {
        var form = this;

        // 绑定的触发事件，默认为 blur
        event = typeof event === 'string' ? event : 'change';

        // 需要验证的表单元素
        var elements = getValidateElement(form.elements);

        // 将需要验证的元素保存至表单属性
        form.validateElements = elements;

        // 表单元素绑定验证
        elements.forEach(function(elem) {
            elem.addEventListener(event, function() {
                var result = checkMethod(elem);
                form.validateTip(elem, result.errorRule, lang[result.errorRule]);
            }, false);
        });

        return form;
    };

    // 错误提示信息
    var validateTip = function(elem, rule, tip) {
        if(!elem.v_tip_node){
            // 如果是单选/复选框则显示最后一条提示信息
            if(/radio|checkbox/ig.test(elem.type) && elem.name) {
                var nodeArr = elem.form[elem.name];
                var lastNode = nodeArr[nodeArr.length - 1];
                if(!lastNode.v_tip_node){
                    elem.v_tip_node = lastNode.v_tip_node = document.createElement('span');
                    lastNode.parentNode.appendChild(elem.v_tip_node);
                } else {
                    elem.v_tip_node = lastNode.v_tip_node;
                }
            } else {
                elem.v_tip_node = document.createElement('span');
                elem.parentNode.appendChild(elem.v_tip_node);
            }
            elem.v_tip_node.className = 'error-msg';
        }

        if(rule == 'succeed'){
            elem.v_tip_node.classList.add('hide');
            elem.parentNode.classList.remove('error');
        } else {
            elem.v_tip_node.classList.remove('hide');
            elem.parentNode.classList.add('error');
            elem.v_tip_node.innerHTML = tip;
            elem.focus();
        }
    };

    HTMLFormElement.prototype.validateTip = validateTip;

    HTMLFormElement.prototype.isCheck = isCheck;

    HTMLFormElement.prototype.bindCheck = bindCheck;

    return {
        isCheck: function(form, tip) {
            isCheck.call(form, tip);
            !form.validateTip && (form.validateTip = validateTip);
        },
        bindCheck: function(form, event) {
            bindCheck.call(form, event);
            !form.validateTip && (form.validateTip = validateTip);
        }
    };
});