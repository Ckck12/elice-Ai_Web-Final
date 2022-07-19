const {Router} = require('express');
const router = Router();
const {User} = require('./../models/');
const asyncHandler = require('../utils/async-handler');
const crypto = require('crypto');
const jwt = require('jsonwebtoken'); //npm i jsonwebtoken -> jwt 설치
const secret = require('./../config/jwt-config');
const shortId = require("../models/schemas/types/short-id");
const nodeMailer = require("nodemailer");


router.post("/signIn", asyncHandler(async (req, res, next) => {

    const {email, password} = req.body;

    const userData = await User.findOne({email});
    if (!userData) {
        throw new Error("회원을 찾을 수 없습니다.");
        return;
    }

    let hashPassword = await passwordHash(password);
    if (hashPassword !== userData.hashPassword) {
        throw new Error("비밀번호가 일치하지 않습니다.");
        return;
    }

    jwt.sign({
            email: email,
            name: userData.name
        },
        secret.secret,
        {
            expiresIn: '1d'  //유효 기간이다. "1y", 일 단위 : "1 days", "1d", 시간 단위 : "2.5 hrs", "2h", 분 단위 : "1m", 초 단위 : "5s"
        }, (err, token) => {
            if (err) {
                res.status(401).json({success: false, errormessage: 'token sign fail'});
            } else {
                res.json({success: true, accessToken: token, shortId: userData.shortId});
            }
        }
    )

}));

// router.post("/logout", asyncHandler((req, res, next) => {
// }))

router.post("/signUp", asyncHandler(async (req, res, next) => {

    const {email, password, name} = req.body;

    let hashPassword = await passwordHash(password);

    const checkEmail = await User.findOne({email});

    if (checkEmail) { //이메일 값 가지고 왔는지 체크
        throw new Error('이미 가입된 이메일 입니다.');
        return;
    }

    await User.create({
        email,
        hashPassword,
        name
    });

    res.json({
        result: "signIn-success"
    })

}));

router.post("/:shortId/find", asyncHandler(async (req, res, next) => {
    let shortId = req.params.shortId;
    let user = await User.find({shortId});

    let transporter = nodeMailer.createTransport({ // 이메일 보낼 사용자 정의하기.
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'dudspsdl123321@gmail.com',
            pass: 'password',
        },
    });

    let info = await transporter.sendMail({
        from: `"WDMA Team" dudspsdl123321@gmail.com`,
        to: user.email,
        subject: 'WDMA Auth Number',
        // text: generatedAuthNumber,
        html: `<b>비밀번호 초기화</b>`,
    });

    console.log('Message sent: %s', info.messageId);


}))

const passwordHash = async (pw) => {
    return crypto.createHash("sha1").update(pw).digest("hex");
}


module.exports = router;