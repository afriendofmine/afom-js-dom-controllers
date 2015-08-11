(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory(require('jquery'));
    } else {
        factory(root.jQuery);
    }
})(window, function($) {

    var Ctrl = function(controllers, options) {

        var myCtrl = this;

        // parse controllers attribute
        controllers = controllers || {};

        // set default options
        var defaultOptions = {
            selector: '[data-controller]'
        };

        // parse options
        options = $.extend({}, defaultOptions, options || {});

        /**
         * Log error message or throw new error
         * @param {string} msg Message to log
         * @param {string|undefined} type Log type (log|info|warn|error) default: log
         */
        this.logMessage = function(msg, type) {
            if (console === undefined) {
                throw msg;
            } else {
                console[type || 'log'](msg);
            }
        };

        /**
         * Use controller for a DOM element
         * @param {number} index
         * @param {DOM} el
         */
        this.useController = function(index, el) {
            var $el = $(el);

            // get controller name
            var ctrlName = $el.data('controller');

            // return and show error if data-controller attribute is empty
            if (!ctrlName) {
                myCtrl.logMessage('Controller not defined', 'warn');
                return;
            }

            // get controller configuration object from controllers collection
            var controller = controllers[ctrlName];

            // return and show error if no controller object is found
            if (!controller) {
                myCtrl.logMessage('Controller "' + ctrlName + '" not found', 'warn');
                return;
            }

            // get controller constructor
            // set controller options (extend defaults with DOM el and controller options)
            var Ctrl = controller.ctrl || controller,
                ctrlOptions = $.extend({}, options, {el: el}, controller.options || {}),
                ctrl;

            if (controller.beforeStart) {
                ctrl = myCtrl.executeBeforeStart(controller.beforeStart, Ctrl, ctrlOptions);
            } else {
                // init controller
                ctrl = myCtrl.runController(Ctrl, ctrlOptions);
            }

            // execute after start
            if (controller.afterStart) {
                myCtrl.executeAfterStart(controller.afterStart, ctrl);
            }
        };

        /**
         * Run controller
         * @param {function} Ctrl
         * @param {object} options
         * @returns {*}
         */
        this.runController = function(Ctrl, options) {
            return new Ctrl(options);
        };

        /**
         * Execute before start callback
         * @param {function} beforeStart
         * @param {function} Ctrl
         * @param {object} ctrlOptions
         * @returns {*}
         */
        this.executeBeforeStart = function(beforeStart, Ctrl, ctrlOptions) {
            if (typeof beforeStart === 'function') {
                var beforeStartResult = beforeStart(ctrlOptions, $.proxy(Ctrl, Ctrl));

                return myCtrl.runController(Ctrl, beforeStartResult || ctrlOptions);
            }

            return myCtrl.runController(Ctrl, ctrlOptions);
        };

        /**
         * Execute after start callback
         * @param {function} afterStart
         * @param {object} ctrlInstance
         * @returns {*}
         */
        this.executeAfterStart = function(afterStart, ctrlInstance) {
            if (typeof afterStart === 'function') {
                afterStart(ctrlInstance);
            }

            return ctrlInstance;
        };

        return {

            /**
             * Run MyCtrl
             */
            run: function() {
                // get elements with controller
                var $el = $(options.selector);

                // order controller bio priority (the higher the sooner)
                $el.sort(function(a, b) {
                    var aPriority = $(a).data('priority'),
                        bPriority = $(b).data('priority');

                    if (aPriority === bPriority || bPriority === undefined) {
                        return 0;
                    }

                    return (aPriority > bPriority) ? -1 : 1;
                });

                // run controllers
                $el.each(myCtrl.useController);
            },

            /**
             * Get/Set new controller
             * @param {string} key Controller name to get/set
             * @param {function|object} [controller]
             * @returns {null|function|object} controller
             */
            controller: function(key, controller) {
                if (controller === undefined) {
                    return controllers[key] || null;
                }

                controllers[key] = controller;

                return controller;
            }

        };
    };

    Ctrl.prototype = {};

    return Ctrl;

});
