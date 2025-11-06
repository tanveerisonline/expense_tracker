export const validateEmail = (email) => /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/.test(email)
export const validatePassword = (password) => password && password.length >= 6
export const validateAmount = (amount) => !isNaN(Number(amount)) && Number(amount) > 0