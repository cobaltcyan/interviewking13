const express = require('express');
const app = express();

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const jwt = require('jsonwebtoken');
// const bcrypt = require('bcrypt');
const { validateEmail } = require('../utils/user.js');
const { hashPassword, comparePassword, isPasswordValid } = require('../utils/encrypt/hashPassword.js');

const secretKey = process.env.SECRET_KEY;

// dts_insert, dts_update 필드에 삽입할 변수 값 설정
const currentDate = new Date();
const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");    // 현재 날짜를 "yyyymmdd" 형식으로 설정
const timeString = currentDate.toTimeString().slice(0, 8).replace(/:/g, "");    // 현재 시간을 "hhmmss" 형식으로 설정

const userService = require('../services/userService');

const userController = {

    /** 회원가입 */
    async postSignUp (req, res, next) {
        try { 
            const { user_name, email, password, passwordCheck, phone_number } = req.body;

            // 입력값 검사
            if (user_name === "" || email === "" || password === "" || passwordCheck === "") {
                return res.status(400).json({
                    resultCode: "400",
                    message: "정보를 모두 입력하세요."
                });
            }

            // 이메일 형식 유효성 검사
            if (!validateEmail(email)) {
                return res.status(400).json({
                resultCode: "400",
                message: "올바른 이메일 형식이 아닙니다.",
                });
            }

            // 비밀번호, 비밀번호 확인 값 검사
            // if (password !== passwordCheck) {
            //     return res.status(400).json({
            //     resultCode: "401",
            //     message: "비밀번호가 일치하지 않습니다.",
            //     });
            // }
            const comparedPassword = await comparePassword(password, passwordCheck); 
            if (comparedPassword) {
                return res.status(400).json(comparedPassword);
            }

            const findUser = await userService.getUserInfoByEmail(email);
            if (findUser) {
                return res.status(400).json({
                    resultCode: "400",
                    message: "기존에 가입되어 있는 회원입니다.",
                    data: {
                        user_id: findUser._id,
                        email: findUser.email
                    }
                });
            }
            
            // 비밀번호 암호화
            // const hashedPassword = await bcrypt.hash(password, 10);
            const hashedPassword = await hashPassword(password);

            const newUserInfo = {
                user_id: new mongoose.Types.ObjectId(), // ObjectId로 user_id 필드에 값을 설정    
                user_name,
                email,
                password: hashedPassword,
                phone_number,
                dts_insert: dateString + timeString,
                dts_update: null
            };

            // userService 함수에 회원가입 정보 전달
            const newUser = await userService.postSignUp(newUserInfo);

            return res.status(200).json({
                resultCode: "200",
                message: "회원가입 성공",
                data: {
                    user_id: newUser._id,
                    email: newUser.email 
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({
                resultCode: "500",
                message: "Internal Server Error"
            });
        }
    },

    /** 로그인 */
    async postSignIn (req, res, next) {
        try {
            const { email, password } = req.body;

            // 입력값 검사
            if (email === "" || password === "") {
              return res.status(400).json({
                resultCode: 400,
                message: "정보를 모두 입력하세요."
              });
            }
        
            // 이메일 형식 유효성 검사
            if (!validateEmail(email)) {
              return res.status(400).json({
                resultCode: "400",
                message: "올바른 이메일 형식이 아닙니다."
              });
            }
        
            const findUser = await userService.getUserInfoByEmail(email);
            if (!findUser) {
              return res.status(404).json({
                resultCode: "404",
                message: "이메일을 조회할 수 없습니다."
              });
            }
            // const isPasswordValid = await bcrypt.compare(password, findUser.password);
            // if (!isPasswordValid) {
            //   return res.status(400).json({
            //     resultCode: "400",
            //     message: "비밀번호가 맞지 않습니다."
            //   });
            // }
            const validatedPassword = await isPasswordValid(password, findUser.password);
            if (validatedPassword) {
                return res.status(400).json(validatedPassword);
            }

            // userService의 loginUser 함수 호출
            const token = await userService.postSignIn(findUser);
        
            return res.status(200)
                        .set('Authorization', token)
                        // .set('Authorization', `Bearer ${token}`)
                        .json({
                            resultCode: "200",
                            message: "로그인 성공",
                            data: {
                            user_id: findUser._id,
                            user_name: findUser.user_name,
                            email,
                            token
                            }
                        });
        } catch (err) {
            console.error(err);
            res.status(500).json({
                resultCode: "500",
                message: "Invalid Error"
            });
        }
    },


    /** user ID 로 사용자 정보 조회(-> token 있으면 다른 사용자 정보 조회 가능) */
    async getUserInfoById (req, res, next) {
        try {
            const { user_id } = req.params;
            const findUser = await userService.getUserInfoById(user_id);
            if (!findUser) {
                return res.status(404).json({
                    resultCode: "404",
                    message: "해당 사용자를 찾을 수 없습니다."
                });
            }
            // console.log(findUser + 'userController');
            return res.status(200).json({
                resultCode: "200", 
                message: "사용자 정보 조회 성공",
                data: findUser
                // data: {
                //     user_id: findUser._id,
                //     user_name: findUser.user_name,
                //     email: findUser.email,
                //     intro_yn: findUser.intro_yn,
                //     phone_number: findUser.phone_number, 
                //     file_key: findUser.file_key, 
                //     file_name: findUser.file_name
                // }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({
                resultCode: "500",
                message: "Invalid Error"
            });
        }
    },
    
    /** 내 정보 조회 */
    async getUserInfoByHeader (req, res, next) {
        try {
            // middleware token값 사용
            const { user_id } = req.user;
            const findUser = await userService.getUserInfoById(user_id);
            if (!findUser) {
                return res.status(400).json({
                    resultCode: "404",
                    message: "내 정보를 조회할 수 없습니다."
                });
            }
            return res.status(200).json({
                resultCode: "200",
                message: "내 정보 조회 성공",
                data: {
                    user_id: findUser._id,
                    user_name: findUser.user_name,
                    email: findUser.email,
                    intro_yn: findUser.intro_yn,
                    phone_number: findUser.phone_number,
                    file_key: findUser.file_key, 
                    file_name: findUser.file_name
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({
                resultCode: "500",
                message: "Internal Server Error"
            });
        }
    },

    /** 내 정보 수정 */
    async postUserInfo (req, res, next) {
        try {
            // 미들웨어에서 전달된 토큰값 사용
            const { user_id } = req.user;
            // const { email, password, intro_yn, phone_number, file_key, file_name } = req.body;
            const { password, passwordCheck, intro_yn, phone_number, file_key, file_name } = req.body;

            // 사용자 정보 조회
            const findUser = await userService.getUserInfoById(user_id);
            if (!findUser) {
                return res.status(400).json({
                    resultCode: "404",
                    message: "내 정보를 조회할 수 없습니다."
                });
            }
            console.log(findUser);
            
            // 비밀번호, 비밀번호 확인 값 검사
            // if (password !== passwordCheck) {
            //     return res.status(400).json({
            //         resultCode: "400",
            //         message: "비밀번호가 일치하지 않습니다."
            //     });
            // }
            const comparedPassword = await comparePassword(password, passwordCheck); 
            if (comparedPassword) {
                return res.status(400).json(comparedPassword);
            }
            
            // 비밀번호 암호화
            // const hashedPassword = await bcrypt.hash(password, 10);
            const hashedPassword = await hashPassword(password);

            // 변경사항이 있는지 확인
            // 기존 사용자 정보
            // const findUserId = findUser._id;
            // const findUserEmail = findUser.email;
            // const findUserName = findUser.user_name;
            const findUserPassword = findUser.password;
            const findUserIntro_yn = findUser.intro_yn;
            const findUserPhoneNumber = findUser.phone_number;
            const findUserFileKey = findUser.file_key;
            const findUserFileName = findUser.file_name;

            // 변경사항 있는지 확인
            let isModified = false;

            if (password !== findUserPassword) {
                findUser.password = password;
                isModified = true;
            }
            if (intro_yn !== findUserIntro_yn) {
                findUser.intro_yn = intro_yn;
                isModified = true;
            }
            if (phone_number !== findUserPhoneNumber) {
                findUser.phone_number = phone_number;
                isModified = true;
            }
            if (file_key !== findUserFileKey) {
                findUser.file_key = file_key;
                isModified = true;
            }
            if (file_name !== findUserFileName) {
                findUser.file_name = file_name;
                isModified = true;
            }

            // 변경사항이 없는 경우의 처리 로직
            if(!isModified) {
                return res.status(200).json({
                    resultCode: "400", 
                    message: "변경사항이 없습니다."
                });
            }

            // 변경사항이 있을 경우에만 업데이트
            const updateUserInfo = {
                password,
                intro_yn,
                phone_number,
                file_key,
                file_name
            };
            const updatedUser = await userService.updateUserInfo(user_id, updateUserInfo);
            
            return res.status(200).json({
                resultCode: "200",
                message: "내 정보 수정 성공",
                data: {
                    user_id: findUser._id,
                    user_name: findUser.user_name,
                    email: findUser.email,
                    intro_yn: updatedUser.intro_yn,
                    phone_number: updatedUser.phone_number,
                    file_key: updatedUser.file_key,
                    file_name: updatedUser.file_name
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({
                resultCode: "500",
                message: "Invalid Error"
            });
        }
    },

    /** 회원탈퇴(hard Delete) */
    async deleteUserInfo (req, res, next) {
        try {
            const { user_id } = req.user;
            const { email, password } = req.body;

            // 사용자 정보 조회
            const findUser = await userService.getUserInfoById(user_id);
            if (!findUser) {
                return res.status(400).json({
                    resultCode: "404",
                    message: "이미 탈퇴한 회원입니다."
                });
            }

            const deleteUserInfo = {
                user_id,
                email,
                password,
            };

            await userService.deleteUserInfo(deleteUserInfo);

            res.setHeader('Authorization', '');
            res.clearCookie('token');

            res.status(200).json({
                resultCode: "200",
                message: "회원탈퇴 성공"
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({
                resultCode: "500",
                message: "Internal Server Error"
            });
        }
    },

    /** 로그아웃 */
    async logoutUser (req, res, next) {
        try {
            const { user_id } = req.user;

            if (user_id) {
                res.setHeader('Authorization', '');
                res.clearCookie('token');

                return res.status(200).json({
                    resultCode: "200",
                    message: "로그아웃 성공"
                });
            } else {
                return res.status(400).json({
                    resultCode: "404",
                    message: "사용자 정보를 찾을 수 없습니다.",
                });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({
                resultCode: "500",
                message: "Internal Server Error"
            });
        }
    }
}

module.exports = userController;
