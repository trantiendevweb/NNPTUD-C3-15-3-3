let userModel = require("../schemas/users");
let bcrypt = require('bcrypt')
let jwt = require('jsonwebtoken')
let fs = require('fs')
let path = require('path')

const PRIVATE_KEY = fs.readFileSync(
    path.join(__dirname, '..', 'keys', 'private.key'),
    'utf8'
)

module.exports = {
    CreateAnUser: async function (username, password, email, role, fullName, avatarUrl, status, loginCount) {
        let newItem = new userModel({
            username: username,
            password: password,
            email: email,
            fullName: fullName,
            avatarUrl: avatarUrl,
            status: status,
            role: role,
            loginCount: loginCount
        });
        await newItem.save();
        return newItem;
    },
    GetAllUser: async function () {
        return await userModel
            .find({ isDeleted: false })
    },
    GetUserById: async function (id) {
        try {
            return await userModel
                .findOne({
                    isDeleted: false,
                    _id: id
                })
        } catch (error) {
            return false;
        }
    },
    QueryLogin: async function (username, password) {
        if (!username || !password) {
            return false;
        }
        let user = await userModel.findOne({
            username: username,
            isDeleted: false
        })
        if (user) {
            if (bcrypt.compareSync(password, user.password)) {
                return jwt.sign({
                    id: user.id
                }, PRIVATE_KEY, {
                    algorithm: 'RS256',
                    expiresIn: '1d'
                })
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    ChangePassword: async function (userId, oldPassword, newPassword) {
        let user = await userModel.findOne({
            _id: userId,
            isDeleted: false
        })
        if (!user) {
            return { ok: false, code: 404, message: "tai khoan khong ton tai" }
        }
        if (!bcrypt.compareSync(oldPassword, user.password)) {
            return { ok: false, code: 400, message: "oldpassword khong dung" }
        }
        user.password = newPassword;
        await user.save();
        return { ok: true, message: "doi mat khau thanh cong" }
    }
}
