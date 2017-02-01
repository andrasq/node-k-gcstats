k-gcstats
=========

kinvey garbage collection statistics tracker

Simple interface to `gc-stats` to allow tracking gc activity in either
incremental or absolute units.


Summary
-------

     kgcstats = require('k-gcstats');

     previousUsage = gcUsage();

     while (!done) {
         currentUsage = kgcstats.gcUsage();
         deltaUsage = kgcstats.gcDelta(currentUsage);
         // ...
         previousUsage = currentUsage;
     }


Api
---

### kgcstats.gcUsage( )

Returns usage statistics in an object with properties
- `pauseMs`     - total milliseconds spent garbage collecting
- `pauseNs`     - additional nanoseconds spent garbage collecting
- `minorCount`  - number of scavenge (minor) gc runs
- `majorCount`  - number of mark/sweep/compact (major) gc runs

### kgcstats.gcDelta( usage, previousUsage )

Returns the gc statistics for the activity between the two usage snapshots.  The
`usage` and `previousUsage` are returned by `gcUsage`.

### hook( )

Listen for and track garbage collection activity.  `hook()` is called automatically
when the package is loaded.

### unhook( )

Stop tracking garbage collection activity.


Related Work
------------

- [gc-stats](https://npmjs.org/package/gc-stats)
