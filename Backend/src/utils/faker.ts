import { faker } from '@faker-js/faker'
import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enum'
import { TweetReqBody } from '~/models/requests/Tweet.requests'
import { RegisterReqBody } from '~/models/requests/User.requests'
import Follower from '~/models/schemas/Follower.schema'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import tweetsService from '~/services/tweets.services'
import { hashPassword } from './hash'

// default password for all fake accounts
const PASSWORD = 'Hehe123~'
// Id to follow other users
const MYID = new ObjectId('68b3e5b0728ed4325944162a')
// number of fake users to create, each one have 2 tweets by default
const USER_COUNT = 100

const createRandomUser = () => {
    const user: RegisterReqBody = {
        name: faker.internet.displayName(),
        email: faker.internet.email(),
        password: PASSWORD,
        confirm_password: PASSWORD,
        date_of_birth: faker.date.past().toISOString()
    }
    return user
}

const createRandomTweet = () => {
    const tweet: TweetReqBody = {
        type: TweetType.Tweet,
        audience: TweetAudience.Everyone,
        content: faker.lorem.paragraph({
            min: 10,
            max: 150
        }),
        hashtags: [faker.lorem.word(), faker.lorem.word()],
        medias: [],
        mentions: [],
        parent_id: null
    }
    return tweet
}

const users: RegisterReqBody[] = faker.helpers.multiple(createRandomUser, { count: USER_COUNT })

const insertMultipleUsers = async (users: RegisterReqBody[]) => {
    console.log('Creating users...')
    const promises = users.map(async (user) => {
        const user_id = new ObjectId()
        const hashedPassword = await hashPassword(user.password)
        await databaseService.users.insertOne(
            new User({
                ...user,
                username: `user${user_id.toString()}`,
                password: hashedPassword,
                date_of_birth: new Date(user.date_of_birth),
                verify: UserVerifyStatus.Verified
            })
        )
        return user_id
    })
    const result = await Promise.all(promises)
    console.log(`Created ${users.length} users`)
    return result
}

const followMultipleUsers = async (user_id: ObjectId, followed_user_ids: ObjectId[]) => {
    console.log('Start Following...')
    const result = await Promise.all(
        followed_user_ids.map(async (followed_user_id) => {
            await databaseService.followers.insertOne(
                new Follower({
                    user_id,
                    followed_user_id: new ObjectId(followed_user_id)
                })
            )
        })
    )
    console.log(`Followed ${result.length} users`)
}

const insertMultipleTweets = async (user_ids: ObjectId[]) => {
    console.log('Creating tweets...')
    let count = 0
    await Promise.all(
        user_ids.map(async (user_id) => {
            await Promise.all([
                tweetsService.createTweet(createRandomTweet(), user_id.toString()),
                tweetsService.createTweet(createRandomTweet(), user_id.toString())
            ])
            count += 2
        })
    )
    console.log(`Created ${count} tweets`)
}

insertMultipleUsers(users)
    .then((user_ids) => {
        Promise.all([followMultipleUsers(new ObjectId(MYID), user_ids), insertMultipleTweets(user_ids)]).catch((err) =>
            console.error('Error in follow or tweet operations:', err)
        )
    })
    .catch((err) => console.error('Error in user creation:', err))
