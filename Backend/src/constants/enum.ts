export enum UserVerifyStatus {
    Unverified,
    Verified,
    Banned,
    Private
}

export enum TokenType {
    AccessToken,
    RefreshToken,
    ForgotPasswordToken,
    EmailVerifyToken
}

export enum MediaType {
    Image,
    Video,
    HLS
}

export enum EncodingStatus {
    Pending,
    Processing,
    Completed,
    Failed
}

export enum TweetType {
    Tweet,
    Retweet,
    Comment,
    QuoteTweet
}

export enum TweetAudience {
    Everyone,
    TwitterCircle
}

export enum NewsFeedType {
    ForYou = 'for-you',
    Following = 'following'
}

export enum SearchType {
    Top,
    Latest,
    People,
    Media
}

export enum SearchSource {
    Anyone,
    Following
}
