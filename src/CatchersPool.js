/**
 * ER-Track
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 捕捉池
 * @author otakustay, dddbear
 */
define(
    function (require) {
        var u = require('underscore');

        var exports = {};

        function bind(method, tracker) {
            if (method) {
                return u.bind(method, tracker);
            }
            return new Function();
        }

        /**
         * 绑定Promise异常捕捉者
         * @param {er-track.Termial} tracker 捕捉者实例
         * @public
         */
        exports.promiseReject = function (tracker) {
            this.getEvents().on(
                'promisereject',
                bind(tracker.trackPromiseReject, tracker)
            );

            this.getPromise().onReject(function (reason) {
                this.getEvents().fire('promisereject', {reason: reason, promise: this});
            });
        };

        /**
         * 绑定Deferred异常捕捉者
         * @param {er-track.Termial} tracker 捕捉者实例
         * @public
         */
        exports.deferredException = function (tracker) {
            this.getDeferred().on(
                'exception',
                bind(tracker.trackException, tracker)
            );
        };

        /**
         * 绑定通用错误捕捉者
         * @param {er-track.Termial} tracker 捕捉者实例
         * @public
         */
        exports.windowError = function (tracker) {
            window.onerror = bind(tracker.trackWindowError, tracker);
        };

        /**
         * 绑定超时行为捕捉者
         * @param {er-track.Termial} tracker 捕捉者实例
         * @public
         */
        exports.requestTimeout = function (tracker) {
            this.getAjax().on(
                'timeout',
                bind(tracker.trackRequestFail, tracker)
            );
        };

        /**
         * 绑定Ajax请求异常捕捉者
         * @param {er-track.Termial} tracker 捕捉者实例
         * @public
         */
        exports.requestFail = function (tracker) {
            this.getAjax().on(
                'fail',
                bind(tracker.trackRequestFail, tracker)
            );
        };

        /**
         * 绑定页面跳转行为捕捉者
         * @param {er-track.Termial} tracker 捕捉者实例
         * @public
         */
        exports.pageView = function (tracker) {
            this.getEvents().on(
                'redirect',
                bind(tracker.trackPageView, tracker)
            );
        };

        /**
         * 绑定页面进入行为捕捉者
         * @param {er-track.Termial} tracker 捕捉者实例
         * @public
         */
        exports.enterAction = function (tracker) {
            this.getEvents().on(
                'enteractioncomplete',
                bind(tracker.trackEnterAction, tracker)
            );
        };

        /**
         * 绑定页面离开行为捕捉者
         * @param {er-track.Termial} tracker 捕捉者实例
         * @public
         */
        exports.leaveAction = function (tracker) {
            this.getEvents().on(
                'leaveaction',
                bind(tracker.trackLeaveAction, tracker)
            );
        };

        /**
         * 获取所有捕捉绑定方法
         * @return {Object}
         * @public
         */
        exports.getAllCatchers = function () {
            return {
                pageView: this.pageView,
                promiseReject: this.promiseReject,
                deferredException: this.deferredException,
                windowError: this.windowError,
                requestTimeout: this.requestTimeout,
                requestFail: this.requestFail,
                enterAction: this.enterAction,
                leaveAction: this.leaveAction
            };
        };

        var eoo = require('eoo');
        eoo.defineAccessor(exports, 'events');
        eoo.defineAccessor(exports, 'promise');
        eoo.defineAccessor(exports, 'deferred');
        eoo.defineAccessor(exports, 'ajax');
        var CatchersPool = eoo.create(exports);
        return CatchersPool;
    }
);
