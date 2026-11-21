import { Request, Router, Response } from "../node_modules/@types/express/index";
import sqlhelper from './sqlhelper';
import start from "./bot/botmain"
import { PathParams } from "../node_modules/@types/express-serve-static-core";

interface HasChannel {
    channel: string;
}

interface Settings extends HasChannel {
    twitch_oauth: string;
    points_name: string;
    points_per_minute: number;
    gamble_multiplier: number;
    gamble_odds: number;
    gamble_time: number;
    bits_mul: number;
    subs_mul: number;
    donations_mul: number;
    // basically depreciated
    should_start: boolean;
    is_joined: boolean;
    password_hash: string;
    twitch_id: boolean;
    expire_date: Date;
    bits_message: string;
    sub_message: string;
    donation_message: string;
}

interface ContestEntrant {
    entrant_channel: string;
    broadcaster_channel: string;
    points: number;
    bet_option: number;
    id: string;
}

interface ContestOption {
    text: string;
    channel: string;
    id: string;
    option_number: number;
}

interface Contest extends HasChannel {
    entrants_id: string;
    options_id: string;
    is_ongoing: boolean;
    description: string;
    start_time: Date;
    is_started: boolean;
    max_bet: number;
}

interface Lottery extends HasChannel {
    entrants_id: string;
    start_time: Date;
    ticket_cost: number;
    ticket_max: number;
    is_ongoing: boolean;
    donations_value: number;
    show_donations: boolean;
}

interface LotteryEntrant {
    id: string;
    entrant_channel: string;
    tickets: number;
    place: number;
}

interface PointsEntry {
    owner_channel: string;
    broadcaster_channel: string;
    points: number;
}

interface AllPointsEntry extends PointsEntry {
    all_points: number;
}

interface RedeemedReward extends HasChannel {
    reward_id: string;
    refund_cost: number;
    redeemer_channel: string;
    reward_info: string;
    redeem_name: Date;
}

interface Reward extends HasChannel {
    reward_name: string;
    reward_price: number;
    reward_description: string;
    id: string;
    do_twitchalert: boolean;
    is_songrequest: boolean;
}

interface StreamlabsKey extends HasChannel {
    twitch_id: string;
    code: string;
    refresh_token: string;
    expires_in: number;
    created_at: Date;
}

type Req = Request & {
    helper: sqlhelper,
    dbpool: any,
    bot: ReturnType<typeof start>,
    cookies: {
        username: string,
        hash: string
    }
};

interface Duel {
    channel: string,
    challenger: string,
    opponent: string,
    points: number,
    challenger_points: number,
    opponent_points: number,
    timeout: number,
    challenger_roll?: number,
    opponent_roll?: number,
}

interface Streak {
    channel: string,
    gambler: string,
    streak: number,
    total: number,
    winning: boolean
}

type myResponseFn = (req: Req, res: Response) => any

class MyRouter {
    constructor(public router: Router) {}
    get = (params: PathParams, f: myResponseFn) => {
        this.router.get(params, f)
    }
    post = (params: PathParams, f: myResponseFn) => {
        this.router.post(params, f)
    }
}

export {
    StreamlabsKey,
    PointsEntry,
    AllPointsEntry,
    Settings,
    RedeemedReward,
    Reward,
    Contest,
    ContestEntrant,
    ContestOption,
    Lottery,
    LotteryEntrant,
    HasChannel,
    MyRouter,
    Req,
    Duel,
    Streak
}