const CustomerModel = require('../models/customer-model');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./mail-service');
const tokenService = require('./token-service');
const CustomerDto = require('../dtos/customer-dto');
const ApiError = require('../exceptions/api-error');

class CustomerService {
  async registration(data) {
    let candidate = await CustomerModel.findOne({ login: data.login });
    if (candidate) {
      throw ApiError.AlreadyExist('customer with this login already exists');
    }
    candidate = await CustomerModel.findOne({ phone: data.phone });
    if (candidate) {
      throw ApiError.AlreadyExist('customer with this phone already exists');
    }
    candidate = await CustomerModel.findOne({ email: data.email });
    if (candidate) {
      throw ApiError.AlreadyExist('customer with this email already exists');
    }

    const hashPassword = await bcrypt.hash(data.password, 3);
    const activationLink = uuid.v4();
    data.password = hashPassword;
    data.activationLink = activationLink;
    const customer = await CustomerModel.create(data);
    await mailService.sendActivationMail(data.email, `${process.env.API_URL}/api/activate/${activationLink}`);

    const customerDto = new CustomerDto(customer);
    const tokens = tokenService.generateTokens({ ...customerDto });
    await tokenService.saveToken(customerDto.id, tokens.refreshToken);

    return { ...tokens, customer: customerDto};
  }

  async activate(activationLink) {
    const customer = await CustomerModel.findOne({activationLink});
    if (!customer) {
      throw ApiError.BadRequest('Неккоректная ссылка активации');
    }
    customer.isActivated = true;
    console.log(customer);
    await customer.save();
  }

  async login(data) {
    const customer = await CustomerModel.findOne({login: data.login});
    if (!customer) {
      throw ApiError.BadRequest('incorrect login')
    }
    const isPassEquals = await bcrypt.compare(data.password, customer.password);
    if (!isPassEquals) {
      throw ApiError.BadRequest('incorrect password')
    }
    const customerDto = new CustomerDto(customer);
    const tokens = tokenService.generateTokens({ ...customerDto });
    await tokenService.saveToken(customerDto.id, tokens.refreshToken);

    return { ...tokens, customer: customerDto};
  }

  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken);
    return token;
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }
    const customerData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken);
    if (!customerData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    }
    const customer = await CustomerModel.findById(customerData.id);
    const customerDto = new CustomerDto(customer);
    const tokens = tokenService.generateTokens({ ...customerDto });
    await tokenService.saveToken(customerDto.id, tokens.refreshToken);

    return { ...tokens, customer: customerDto};
  }

  async deleteCustomer(id, refreshToken) {
    const customer = await CustomerModel.deleteOne({_id: id});
    const token = await tokenService.removeToken(refreshToken);
  }

  async getCustomerPersonalInfo(id) {
    const returnFields = `-_id name surname middleName 
    birthday sex interfaceLanguage phone 
    email defaultOrderReceiver login interests 
    pets additionalInfo createdAt updatedAt`;
    const customer = await CustomerModel.findById(id, returnFields)
    return customer
  }
}

module.exports = new CustomerService();