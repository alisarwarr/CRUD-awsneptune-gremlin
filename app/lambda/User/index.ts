import createUser from './createUser';
import deleteUser from './deleteUser';
import allUsers from './allUsers';
import User from './type/User';

type AppSyncEvent = {
    info: {
        fieldName: string
    },
    arguments: {
        user: User,
        thatId: string
    }
}

exports.handler = async(event: AppSyncEvent) => {
    switch(event.info.fieldName) {
        case "createUser":
            return await createUser(event.arguments.user);

        case "deleteUser":
            return await deleteUser(event.arguments.thatId);

        case "allUsers":
            return await allUsers();

        default:
            return null;
    }
}