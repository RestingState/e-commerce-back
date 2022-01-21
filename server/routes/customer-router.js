const Router = require('express');
const router = new Router();
const customerController = require('../controllers/customer-controller');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/auth-middleware');

router.post(
  '/registration',
  body('login').isLength({ min: 5, max: 32 }),
  body('password').isLength({ min: 5, max: 32 }),
  body('email').isEmail(),
  customerController.registration
);
router.post('/login', customerController.login);
router.post('/logout', customerController.logout);
router.get('/activate/:link', customerController.activate);
router.get('/refresh', customerController.refresh);
router.delete('', authMiddleware, customerController.deleteCustomer);
router.get('/personalInfo', authMiddleware, customerController.getPersonalInfo);
router.patch(
  '/personalInfo',
  authMiddleware,
  customerController.updatePersonalInfo
);
router.post(
  '/createOrderReceiver',
  authMiddleware,
  customerController.createOrderReceiver
);
router.patch(
  '/updateOrderReceiver/:id',
  authMiddleware,
  customerController.updateOrderReceiver
);
router.delete(
  '/deleteOrderReceiver/:id',
  authMiddleware,
  customerController.deleteOrderReceiver
);
router.get(
  '/getOrderReceivers/:id',
  authMiddleware,
  customerController.getOrderReceivers
);
router.get(
  '/orderReceiver/primary',
  authMiddleware,
  customerController.getPrimaryOrderReceiver
);
router.post(
  '/basket/product/:id',
  authMiddleware,
  customerController.addToBasket
);
router.delete(
  '/basket/deleteProduct/:id',
  authMiddleware,
  customerController.deleteFromBasket
);
router.get(
  '/basket/items',
  authMiddleware,
  customerController.getProductsFromBasket
);

module.exports = router;
