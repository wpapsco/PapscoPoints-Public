function FPArray(array) {
    if (array === undefined) {
        this.array = []
    } else {
        this.array = array
    }
    this.map = (f, thisArg) => new FPArray(this.array.map(f, thisArg))
    this.fill = (e) => this.map((v) => e)
    this.fold = (f, initialValue) =>
        initialValue === undefined ? this.array.reduce(f) : this.array.reduce(f, initialValue)
    this.foldRight = (f, initialValue) =>
        initialValue === undefined ? this.array.reduceRight(f) : this.array.reduceRight(f, initialValue)
    this.sum = () => this.fold((acc, c) => acc + c)
    this.some = (f) => this.fold((a, c, i) => f(c, i) || a, false)
    this.forAll = (f) => this.fold((a, c, i) => f(c, i) && a, true)
    this.filter = (f) => new FPArray(this.array.filter(f))
    const flattenOnce = (ar) => ar.fold((a, c) => isFPArray(c) ? a.appendAll(c) : a.append(c), new FPArray())
    const flattenAll = () => this.some(c => isFPArray(c)) ? flattenOnce(this).flatten() : new FPArray(array)
    this.flatten = (n) => {
        if (n === undefined)
            return flattenAll()
        if (n === 0)
            return new FPArray(this.array)
        return flattenOnce(this).flatten(n - 1)
    }
    this.flatMap = (f) => this.map(f).flatten(1)
    this.length = this.array.length
    this.append = (e) => new FPArray(this.array.concat([e]))
    this.appendAll = (es) => new FPArray(this.array.concat(es.toArray()))
    this.prepend = (e) => new FPArray([e].concat(this.array))
    this.prependAll = (es) => new FPArray(es.toArray().concat(this.array))
    this.pad = (o, amount) => {
        const padding = module.exports.FPArray.fromSize(amount ? amount : 1).fill(o)
        return new FPArray(this.array).appendAll(padding).prependAll(padding)
    }
    this.toFPIterator = () => new FPIterator(this.array[0], (c, i) => this.array[i], () => true, this.length).withLength(this.length)
    this.toString = () => 'FP[' + this.fold((a, c) => a + ", " + c.toString()) + ']'
    this.get = (i) => this.array[i]
    this.toArray = () => this.array
}

const fromArray = (array) => {
    if (Array.isArray(array)) {
        if (array.some(e => Array.isArray(e))) {
            return new FPArray(array.map(e => fromArray(e)))
        } else {
            return new FPArray(array)
        }
    } else return array
}

const isFPArray = (obj) => obj instanceof FPArray

function FPIterator(initial, next, hasNext, length, mapFunction) {
    this.mapFunction = mapFunction ? mapFunction : (e) => e
    this.current = initial
    this.length = length
    this.index = 0
    this.next = () => {
        if (hasNext(this.current, this.index)) {
            this.index = this.index + 1
            const ret = this.current
            this.current = next(this.current, this.index)
            return this.mapFunction(ret, this.index)
        } else return undefined
    }
    this.hasNext = () => hasNext(this.current, this.index)
    this.withLength = (i) => {
        this.length = i
        return new FPIterator(initial, next, (cur, ind) => hasNext(cur, ind) && ind < i, i, mapFunction)
    }
    this.isBeforeNext = () => index < 0
    this.map = (f) => new FPIterator(initial, next, hasNext, length, (cur, ind) => f(this.mapFunction(cur, ind), ind), length, mapFunction)
    this.fold = (f, initial) => {
        var ret = initial
        if (initial === undefined && this.hasNext()) {
            ret = this.next()
        } else if (initial === undefined) {
            return undefined
        }
        while (this.hasNext()) {
            ret = f(ret, this.next())
        }
        return ret
    }
    this.sum = () => this.fold((a, b) => a + b)
    this.getLength = () => {
        if (this.length === Number.POSITIVE_INFINITY) {
            return this.fold((a, b) => a + 1, 0)
        } else return length
    }
    this.takeWhile = (f) => new FPIterator(initial, next, (cur, ind) => hasNext(cur, ind) && f(cur, ind), length, mapFunction)
    this.toFPArray = (l) => {
        if (l === undefined && this.length === Number.POSITIVE_INFINITY) {
            return this.fold((a, b) => a.append(b), new FPArray([]))
        }
        return module.exports.FPArray.fromSize(this.length || l).map(this.next)
    }
    this.foreach = (f) => {
        while (this.hasNext()) {
            f(this.next(), this.index)
        }
    }
    this.toArray = () => this.toFPArray().toArray
}

module.exports = {
    FPArray: {
        fromSize: (size, fill) => new FPArray(Array(size).fill(fill ? fill : 0)),
        fromArray,
        isFPArray,
        fromRange: (until, by, from) => {
            const fr = from ? from : 0
            const b = by ? by : 1
            return new FPArray(Array(Math.ceil((until - fr) / b)).fill(0)).map((e, i) => fr + i * b)
        }
    },
    FPIterator: {
        create: (initial, next, hasNext) => new FPIterator(initial, next, hasNext, Number.POSITIVE_INFINITY),
        fromArray: (array) => new FPArray(array).toFPIterator(),
        fromRange: (until, by, from) => new FPIterator(
            from ? from : 0,
            (c, i) => c + (by ? by : 1),
            (c) => until ? c < until : true,
            Number.POSITIVE_INFINITY
        )
    },
    println: (any) => isFPArray(any) ? console.log(any.toString()) : console.log(any),
    time: (f, times) => {

        const start = new Date().getTime()
        var result = undefined
        for (var i = 0; i < (times ? times : 1); i++) {
            result = f()
        }
        const end = new Date().getTime()
        return {
            result,
            elapsed: end - start
        }
    }
}