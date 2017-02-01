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

/**
 * kgcstats -- kinvey garbage collection statistics tracker
 *
 * Simple interface to `gc-stats` to allow tracking gc activity in either
 * incremental or absolute units.
 *
 * Returns usage statistics in an object with properties:
 *      `pauseMs`       total milliseconds spent garbage collecting
 *      `pauseNs`       additional nanoseconds spent garbage collecting
 *      `minorCount`    number of scavenge (minor) gc runs
 *      `majorCount`    number of mark/sweep/compact (major) gc runs
 *
 * Sample usage:
 *      kgcstats = require('kgcstats');
 *
 *      previousUsage = gcUsage();
 *
 *      while (!done) {
 *          currentUsage = kgcstats.gcUsage();
 *          deltaUsage = kgcstats.gcDelta(currentUsage);
 *          previousUsage = currentUsage;
 *      }
 */


'use strict';

var util = require('util');
var events = require('events');
var gcstats = (require('gc-stats'))();

var MILLION_NS = 1000000;       // nanonseconds per millisecond conversion
var GC_MINOR_MASK = 1;          // gc-stats scavenge type gc bitmask
var GC_MAJOR_MASK = 2;          // gc-stats mark/sweep/compat type gc bitmask


/*
 * garbage collection tracker.
 * Use as a singleton, but ok to have more than one active.
 */
function GcEventTracker( ) {
    this.usage = {
        pauseMs: 0,             // total ms gc delay
        pauseNs: 0,             // additional gc delay ns, on top of ms
        minorCount: 0,          // scavenge gc operations
        majorCount: 0,          // mark/sweep/compact gc operations
    };
    this.tracker = null;        // gc tracker function, when hooked
}
util.inherits(GcEventTracker, events.EventEmitter);

// start tracking gc events
GcEventTracker.prototype.hook = function hook( ) {
    var usage = this.usage;
    if (!this.tracker) this.tracker = function(info) {
        // track total gc time with ns precision, without overflow
        usage.pauseNs += info.pause;
        if (usage.pauseNs > MILLION_NS) {
            usage.pauseMs += Math.floor(usage.pauseNs / MILLION_NS);
            usage.pauseNs %= MILLION_NS;
        }

        // count minor (scavenge) and major (mark/sweep/compact) gc events
        if (info.gctype & GC_MINOR_MASK) usage.minorCount += 1;
        if (info.gctype & GC_MAJOR_MASK) usage.majorCount += 1;
    };
    gcstats.on('stats', this.tracker);
    return this;
}

// stop tracking gc events
GcEventTracker.prototype.unhook = function unhook( ) {
    gcstats.removeListener('stats', this.tracker);
    this.tracker = null;
    return this;
}

// report total gc stats or the activity since the last report
GcEventTracker.prototype.gcUsage = function gcUsage( ) {
    var usage = this.copyFields({}, this.usage);
    return usage;
}

// compute the increase in usage since the previous snapshot
GcEventTracker.prototype.gcDelta = function gcDelta( usage, previousUsage ) {
    usage = this.copyFields({}, usage);

    usage.pauseMs -= previousUsage.pauseMs;
    usage.pauseNs -= previousUsage.pauseNs;
    if (usage.pauseNs < 0) {
        usage.pauseMs -= 1;
        usage.pauseNs += MILLION_NS;
    }
    usage.minorCount -= previousUsage.minorCount;
    usage.majorCount -= previousUsage.majorCount;

    return usage;
}

GcEventTracker.prototype.copyFields = function copyFields( to, from ) {
    for (var k in from) to[k] = from[k];
    return to;
}

// accelerate method calls
GcEventTracker.prototype = GcEventTracker.prototype;

// export the `gcUsage` function, as well the implementation singleton.
// Reassigning exports.singleton will have no effect, to keep gcUsage a bare function
var singleton = new GcEventTracker().hook();
module.exports = {
    gcUsage: function(){ return singleton.gcUsage() },
    gcDelta: function(usage, prev) { return singleton.gcDelta(usage, prev) },

    GcEventTracker: GcEventTracker,
    singleton: singleton,
}
