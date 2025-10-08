const { body, param, query, validationResult } = require('express-validator');

// Middleware para tratar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Validações para registro de usuário
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome deve ter entre 2 e 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços'),
  
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email muito longo'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  
  body('phone')
    .matches(/^\d{10,11}$/)
    .withMessage('Telefone deve ter 10 ou 11 dígitos')
    .custom((value) => {
      // Se tiver 11 dígitos, verifica se o primeiro dígito após o DDD é 9 (celular)
      if (value.length === 11 && value.charAt(2) !== '9') {
        throw new Error('Telefone deve ser um celular (começar com 9)');
      }
      // Se tiver 10 dígitos, verifica se o primeiro dígito após o DDD é 9 (celular)
      if (value.length === 10 && value.charAt(2) !== '9') {
        throw new Error('Telefone deve ser um celular (começar com 9)');
      }
      return true;
    }),
  
  body('cpf')
    .matches(/^\d{11}$/)
    .withMessage('CPF deve ter 11 dígitos')
    .custom((value) => {
      // Verifica se todos os dígitos são iguais
      if (/^(\d)\1{10}$/.test(value)) {
        throw new Error('CPF inválido');
      }
      
      // Validação do primeiro dígito verificador
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(value.charAt(i)) * (10 - i);
      }
      let remainder = 11 - (sum % 11);
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(value.charAt(9))) {
        throw new Error('CPF inválido');
      }
      
      // Validação do segundo dígito verificador
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(value.charAt(i)) * (11 - i);
      }
      remainder = 11 - (sum % 11);
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(value.charAt(10))) {
        throw new Error('CPF inválido');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// Validações para login
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
  
  handleValidationErrors
];

// Validações para upload de imagem
const validateUpload = [
  body('plan')
    .isIn(['basic', 'complete'])
    .withMessage('Plano deve ser "basic" ou "complete"'),
  
  handleValidationErrors
];

// Validações para parâmetros de ID
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} deve ser um ID válido`),
  
  handleValidationErrors
];

// Validações para consulta de créditos
const validateCreditsQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro maior que 0'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser entre 1 e 100'),
  
  handleValidationErrors
];

// Validações para webhook do n8n
const validateN8nWebhook = [
  body('analysisId')
    .isMongoId()
    .withMessage('ID da análise deve ser válido'),
  
  body('status')
    .isIn(['completed', 'failed'])
    .withMessage('Status deve ser "completed" ou "failed"'),
  
  body('result')
    .optional()
    .isObject()
    .withMessage('Resultado deve ser um objeto'),
  
  handleValidationErrors
];

// Validações para webhook do AppMax
const validateAppMaxWebhook = [
  body('transactionId')
    .notEmpty()
    .withMessage('ID da transação é obrigatório'),
  
  body('status')
    .isIn(['approved', 'pending', 'cancelled', 'refunded'])
    .withMessage('Status deve ser válido'),
  
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Valor deve ser um número positivo'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateUpload,
  validateObjectId,
  validateCreditsQuery,
  validateN8nWebhook,
  validateAppMaxWebhook
};
