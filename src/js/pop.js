+(function(window, $) {
    'use strict';

    var $win,
        ready = {};

    var Class = function (settings) {
        var that = this;
        this.config = $.extend({}, this.config, settings);
        this.create();
    }

    // 缓存常用字符
    var doms = {
        modal: 'modal',
        modalDialog: '.modal__dialog',
        modalTitle: '.modal__title',
        modalClose: '.modal__close',
        msg: '.message'
    }

    // 默认配置
    Class.prototype.config = {
        modalType: '',                                       // alert, confirm, loading, msg
        icon: 'success',                                     // success, danger, warning
        title: '默认标题',
        content:'',
        btn: ['确认', '取消'],
        offset: true,
        time: 3000,
        zindex: null
    }

    // 容器
    Class.prototype.vessel = function (callback) {
        var that = this,
            config = this.config,
            zindex = config.zindex,
            times = ++modal.index;

        callback([
            '<div class="modal animated bounceIn" id="modal' + times + '">' +
                '<div class="modal__dialog">' +
                    '<div class="modal__content">' +
                        '<div class="modal__header">' +
                            '<h5 class="modal__title">' + config.title + '</h5>' +
                            '<button type="button" class="close modal__close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                        '</div>' +
                        '<div class="modal__body">' +
                            config.content +
                        '</div>' +
                        '<div class="modal__footer">' +
                            '<button type="button" class="r-btn r-btn_secondary">Close</button> ' +
                            '<button type="button" class="r-btn r-btn_primary">Save changes</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>',
            '<div class="r-message animated bounceIn" id="modal' + times + '">' +
                '<div class="r-message__icon"><i class="r-iconfont r-icon-' + config.icon + ' text_' + config.icon + '"></i></div>' +
                '<div class="r-message__text">' + config.content + '</div>' +
            '</div>'
        ])
        return this;
    }

    // 把modal添加到页面中
    Class.prototype.create = function () {
        var that = this,
            config = this.config;

        this.vessel(function(html) {
            if (config.modalType === 'msg') {
                doms.body.append(html[1]);
            }
            else if (config.modalType == 'confirm') {
                doms.body.append(html[0]);

                that.modal = $(doms.modal);
                that.modalDialog = $(doms.modalDialog);
            }

        })

        this.modalFlag = '#' + doms.modal + modal.index;
        console.log(this.modalFlag);

        this.offset();
        this.close();
    }

    // 计算容器位置
    Class.prototype.offset = function () {
        var config = this.config,
            $modalDialog = $(this.modalFlag),
            area = {
                width: $modalDialog.width(),
                height: $modalDialog.height()
            },
            winWidth = $win.width(),
            winHeight = $win.height();

        $modalDialog.css({
            position: 'fixed',
            top : (winHeight - area.height) / 2,
            left : (winWidth - area.width) / 2
        });
    }

    // callback
    Class.prototype.close = function () {
        var that = this,
            $modal = $(this.modalFlag);
        $(doms.modalClose).on('click', function() {
            $modal.removeClass('bounceIn').addClass('bounceOut').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
                modal.close();
            });
        });
    }

    var modal = {
        index: 0,

        confirm : function (content) {
            return modal.open(
                $.extend({
                    modalType:'confirm',
                    content: content
                })
            );
        },
        msg : function (icon, content) {
            return modal.open(
                $.extend({
                    modalType: 'msg',
                    icon: icon,
                    content: content
                })
            )
        },
        close: function () {
            $(doms.modal).remove();
        }
    }

    ready.run = function() {
        $win = $(window),
        doms.html = $('html'),
        doms.body = $('body');
        modal.open = function(settings) {
            var o = new Class(settings);
            return o;
        }
    }

    window.modal = modal;

    ready.run();

})(window, jQuery)

$('#defaultModal').click(function(event) {
    modal.confirm('第一个测试内容1');
});

$(document).on('click', '#defaultMsg', function(event) {
    event.preventDefault();
    /* Act on the event */
    modal.msg('success', 'msg自定义内容');
});
