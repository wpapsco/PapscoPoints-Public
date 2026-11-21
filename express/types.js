"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MyRouter {
    constructor(router) {
        this.router = router;
        this.get = (params, f) => {
            this.router.get(params, f);
        };
        this.post = (params, f) => {
            this.router.post(params, f);
        };
    }
}
exports.MyRouter = MyRouter;
