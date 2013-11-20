/**
 * ER-Track
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 主入口
 * @author otakustay
 */
define(
    function (require) {
        var exports = {};

        var config = {
            packageName: 'er-track'
        };

        var trackers = {};

        function each(method, args) {
            for (var name in trackers) {
                if (trackers.hasOwnProperty(name)) {
                    var tracker = trackers[name];
                    tracker[method] && tracker[method].apply(tracker, args);
                }
            }
        }

        /**
         * 设置配置
         *
         * @param {string} name 配置项名称
         * @param {Mixed} value 配置项值
         */
        exports.config = function (name, value) {
            config[name] = value;
            return this;
        };

        /**
         * 启用指定追踪器
         *
         * @param {string} name 追踪器名称
         * @return {Object}
         */
        exports.use = function (name) {
            if (trackers[name]) {
                return trackers[name];
            }

            var proxy = {
                name: name,

                configuration: {},

                config: function (name, value) {
                    this.configuration[name] = value;
                    return this;
                },

                setAccount: function (account) {
                    return this.config('account', account);
                }
            };

            trackers[name] = proxy;

            return proxy;
        };

        var pendingCommands = [];

        function flushPendingCommands() {
            for (var i = 0; i < pendingCommands.length; i++) {
                var method = pendingCommands[i][0];
                var args = pendingCommands[i][1];

                each(method, args);
            }
        }

        /**
         * 启用追踪
         */
        exports.start = function () {
            var dependencies = [];
            for (var name in trackers) {
                if (trackers.hasOwnProperty(name)) {
                    var moduleName = config.packageName + '/trackers/' + name;
                    dependencies.push(moduleName);
                }
            }

            window.require(
                dependencies,
                function () {
                    var pendingUnits = arguments.length;

                    function forward() {
                        pendingUnits--;
                        if (pendingUnits === 0) {
                            // 刷掉未执行的命令
                            flushPendingCommands();

                            // 之后所有的命令全部直接执行
                            pendingCommands = {
                                push: function (command) {
                                    each(command[0], command[1]);
                                }
                            };
                        }
                    }

                    for (var i = 0; i < arguments.length; i++) {
                        // 用加载过来的追踪器替换现在的`proxy`
                        var tracker = arguments[i];
                        var config = trackers[tracker.name].configuration;
                        tracker.initialize(config);
                        trackers[tracker.name] = tracker;
                        // 让所有的追踪器能load一下，经典N -> 1的并发模型
                        tracker.load(forward);
                    }
                }
            );

            var events = require('er/events');

            events.on(
                'redirect',
                function (e) {
                    pendingCommands.push(['trackPageView', [e]]);
                }
            );
        };

        return exports;
    }
);