import { InputType, ObjectType, Field, Resolver, Query, Subscription, Root, Arg } from 'type-graphql';
import 'reflect-metadata';

@ObjectType()
export class Message {
    @Field(type => Number)
    id: Number = 0
    @Field(type => String)
    content: String = ""
};

@InputType()
export class MessageInput {
    @Field(type => Number)
    id: Number = 0
    @Field(type => String)
    content: String = ""
};

@Resolver(Message)
export class MessageResolver {
    @Query(returns => [Message])
    messages(): Message[] {
        return [
            { id: 0, content: 'Hello!' },
            { id: 1, content: 'Bye!' },
        ];
    }

    @Subscription(returns => Message, {
        topics: "MESSAGE_CREATED"
    })
    messageCreated(
        @Arg("message", type => MessageInput) message : Message
    ): Message {
        console.log(message);
        return message;
    }
};
