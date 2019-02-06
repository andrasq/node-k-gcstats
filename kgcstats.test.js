/**
 * Copyright (c) 2017, Kinvey, Inc. All rights reserved.
 *
 * This software is licensed to you under the Kinvey terms of service located at
 * http://www.kinvey.com/terms-of-use. By downloading, accessing and/or using this
 * software, you hereby accept such terms of service  (and any agreement referenced
 * therein) and agree that you have read, understand and agree to be bound by such
 * terms of service and are of legal age to agree to such terms with Kinvey.
 *
 * This software contains valuable confidential and proprietary information of
 * KINVEY, INC and is subject to applicable licensing agreements.
 * Unauthorized reproduction, transmission or distribution of this file and its
 * contents is a violation of applicable laws.
 */

'use strict';

var assert = require('assert');
var kgc = require('./kgcstats');

describe ('kgcstats', function() {
    var gc1, gc2;

    // exercise the memory subsystem a bit.  This loop, in combination with
    // the first 'it' clause, will generate gc scavenge activity under mocha.
    var x = [];
    for (var i=0; i<10000; i++) {
        x = new Array();
        for (var j=0; j<1000; j++) x[j] = new Array(j % 20 + 1);
    }

    describe ('gcUsage', function() {
        it ('should expose expected methods', function(done) {
            assert(typeof kgc.gcUsage === 'function');
            assert(typeof kgc.gcDelta === 'function');
            done();
        })

        it ('should return expected fields', function(done) {
            gc1 = kgc.gcUsage();
            assert('pauseMs' in gc1);
            assert('pauseNs' in gc1);
            assert('minorCount' in gc1);
            assert('majorCount' in gc1);
            done();
        })

        it ('should report gc activity', function(done) {
            assert(gc1.minorCount > 0 || gc1.majorCount > 0);
            assert(gc1.pauseMs > 0 || gc1.pauseNs > 0);
            done();
        })
    })

    describe ('gcDelta', function() {
        it ('should compute usage delta by subtracting fields', function(done) {
            gc1 = { pauseMs: 100, pauseNs: 2000, minorCount: 3, majorCount: 4 };
            gc2 = { pauseMs: 200, pauseNs: 4000, minorCount: 13, majorCount: 24 };

            var delta = kgc.gcDelta(gc2, gc1);

            assert(delta.pauseMs === 100);
            assert(delta.pauseNs === 2000);
            assert(delta.minorCount === 10);
            assert(delta.majorCount === 20);

            done();
        })

        it ('should correctly handle usageNs underflow', function(done) {
            gc1 = { pauseMs: 100, pauseNs: 2000, minorCount: 3, majorCount: 4 };
            gc2 = { pauseMs: 200, pauseNs: 1999, minorCount: 3, majorCount: 4 };

            var delta = kgc.gcDelta(gc2, gc1);

            assert(delta.pauseMs === 99);
            assert(delta.pauseNs === 999999);

            done();
        })
    })
})
