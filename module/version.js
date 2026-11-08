/**
 * @file module/version.js
 * @description 이원화 버전 관리 (정식 SemVer 및 일자 기반 캐시 버스팅 태그)
 */
(function (window) {
    'use strict';

    const WebpointerVersion = {
        SEMVER: '1.0.0',
        BUILD_TAG: '20261108v2',
        getFullVersion() {
            return `v${this.SEMVER} (${this.BUILD_TAG})`;
        }
    };

    window.WebpointerVersion = WebpointerVersion;
})(window);
