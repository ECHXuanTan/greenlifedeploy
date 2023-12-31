import axios from 'axios';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Card from 'react-bootstrap/Card';
import { Link } from 'react-router-dom';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { Store } from '../store';
import { getError } from '../utils';
import { toast } from 'react-toastify';
import ReactGA from 'react-ga4';

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, order: action.payload, error: '' };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'PAY_REQUEST':
    return { ...state, loadingPay: true };
    case 'PAY_SUCCESS':
      return { ...state, loadingPay: false, successPay: true };
    case 'PAY_FAIL':
      return { ...state, loadingPay: false };
    case 'PAY_RESET':
      return { ...state, loadingPay: false, successPay: false };
    default:
      return state;
  }
}

export default function OrderScreen() {
  const { state } = useContext(Store);
  const { userInfo } = state;

  const params = useParams();
  const { id: orderId } = params;
  const navigate = useNavigate();

  const [{ loading, error, order, successPay, loadingPay }, dispatch] =
    useReducer(reducer, {
      loading: true,
      order: {},
      error: '',
      successPay: false,
      loadingPay: false,
    });

  const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();

  function createOrder(data, actions) {
    const usdAmount = (order.totalPrice / 24000).toFixed(2);
    return actions.order
      .create({
        purchase_units: [
          {
            amount: { currency_code: 'USD',
            value: usdAmount, },
          },
        ],
      })
      .then((orderID) => {
        return orderID;
      });
  }

  function onApprove(data, actions) {
    return actions.order.capture().then(async function (details) {
      try {
        dispatch({ type: 'PAY_REQUEST' });
        const { data } = await axios.put(
          `https://greenlife-deploy-5.onrender.com/api/orders/${order._id}/pay`,
          details,
          {
            headers: { authorization: `Bearer ${userInfo.token}` },
          }
        );
        dispatch({ type: 'PAY_SUCCESS', payload: data });
        toast.success('Thanh toán thành công');
        // ReactGA.event({
        //   category: "Button",
        //   action: "purchase",
        //   label: "click",
        //   value: order.totalPrice
        // });
        ReactGA.gtag('event', 'purchase', {
          transaction_id: order._id,
          value: order.totalPrice,
          currency: 'VND',
        });
      } catch (err) {
        dispatch({ type: 'PAY_FAIL', payload: getError(err) });
        toast.error(getError(err));
      }
    });
  }
  function onError(err) {
    toast.error(getError(err));
  }

  

  useEffect(() => {

    const script = document.createElement('script');
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-DGTK9CB1L0';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.dataLayer = window.dataLayer || [];
            function gtag() {
                window.dataLayer.push(arguments);
            }
            gtag('js', new Date());
            gtag('config', 'G-DGTK9CB1L0');
        };

     // Create a URLSearchParams object
  const urlParams = new URLSearchParams(window.location.search);
  
  // Use the .get method to get the value of `vnp_ResponseCode`
  const vnpResponseCode = urlParams.get('vnp_ResponseCode');
  
  // Log the value
  console.log('vnp_ResponseCode:', vnpResponseCode);

  if (!order._id || vnpResponseCode === '00') {
    // Payment successful, update the order status
    axios.put(
      `https://greenlife-deploy-5.onrender.com/api/orders/${order._id}/pay`, 
      {
        id: urlParams.get('vnp_TransactionNo'),
        status: 'COMPLETED',
        update_time: new Date().toISOString(),
      },
      {
        headers: { authorization: `Bearer ${userInfo.token}` },
      }
    )
    .then(() => {
      toast.success('Thanh toán thành công');
      // Refresh the order details
      fetchOrder();
      window.history.replaceState({}, document.title, window.location.pathname);
    })
    .catch((error) => {
      console.error('Error updating order status:', error);
    });
  }

    const fetchOrder = async () => {
      try {
        dispatch({ type: 'FETCH_REQUEST' });
        const { data } = await axios.get(`https://greenlife-deploy-5.onrender.com/api/orders/${orderId}`, {
          headers: { authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
      }
    };

    if (!userInfo) {
      return navigate('/login');
    }
    if (!order._id || successPay || (order._id && order._id !== orderId)) {
      fetchOrder();
      if (successPay) {
        dispatch({ type: 'PAY_RESET' });
      }
    } else {
      const loadPaypalScript = async () => {
       
        const { data: clientId } = await axios.get('https://greenlife-deploy-5.onrender.com/api/keys/paypal', {
          headers: { authorization: `Bearer ${userInfo.token}` },
        });
        paypalDispatch({
          type: 'resetOptions',
          value: {
            'client-id': clientId,
            currency: 'USD',
          },
        });
        paypalDispatch({ type: 'setLoadingStatus', value: 'pending' });
      };
      loadPaypalScript();
    }
  }, [order, userInfo, orderId, navigate, paypalDispatch, successPay]);

  function onVnpayClick() {
    const returnUrl = `https://greenlife-deploy-5.onrender.com/order/${order._id}`

    axios.get('https://greenlife-deploy-5.onrender.com/api/vnpayRouter/create_payment_url', {
      params: {
        amount: order.totalPrice, // Set the amount as order.totalPrice
        returnUrl,
      },
    }).then((response) => {
      // Redirect the browser to the VNPAY URL after receiving the response
      window.location.href = response.data.url;
    }).catch((error) => {
      console.error('Error fetching VNPAY URL', error);
    });
  }
  return loading ? (
    <LoadingBox></LoadingBox>
  ) : error ? (
    <MessageBox variant="danger">{error}</MessageBox>
  ) : (
    <div>
      <Helmet>
        <title>Đơn hàng {orderId}</title>
      </Helmet>
      <h1 className="my-3">Đơn hàng {orderId}</h1>
      <Row>
        <Col md={8}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Địa chỉ nhận hàng</Card.Title>
              <Card.Text>
                <strong>Họ và tên:</strong> {order.shippingAddress.fullName} <br />
                <strong>Số điện thoại:</strong> {order.shippingAddress.phoneNumber} <br />
                <strong>Địa chỉ: </strong> {order.shippingAddress.address}, {order.shippingAddress.district},
                {order.shippingAddress.city}, 
              </Card.Text>
              {order.isDelivered ? (
                <MessageBox variant="success">
                  Giao tại {order.deliveredAt}
                </MessageBox>
              ) : (
                <MessageBox variant="danger">Chưa được giao</MessageBox>
              )}
            </Card.Body>
          </Card>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Thanh toán</Card.Title>

              {order.isPaid ? (
                <MessageBox variant="success">
                  Đã thanh toán {order.paidAt}
                </MessageBox>
              ) : (
                <MessageBox variant="danger">Chưa thanh toán</MessageBox>
              )}
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Sản phẩm</Card.Title>
              <ListGroup variant="flush">
                {order.orderItems.map((item) => (
                  <ListGroup.Item key={item._id}>
                    <Row className="align-items-center">
                      <Col md={6}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="img-fluid rounded img-thumbnail"
                        ></img>{' '}
                        <Link to={`/product/${item.slug}`}>{item.name}</Link>
                      </Col>
                      <Col md={3}>
                        <span>{item.quantity}</span>
                      </Col>
                      <Col md={3}>{item.price}đ</Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Đơn hàng</Card.Title>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <Row>
                    <Col>Sản phẩm</Col>
                    <Col>{order.itemsPrice.toFixed(2)}đ</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Phí vận chuyển</Col>
                    <Col>{order.shippingPrice.toFixed(2)}đ</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Thuế</Col>
                    <Col>{order.taxPrice.toFixed(2)}đ</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>
                      <strong> Giá trị đơn hàng</strong>
                    </Col>
                    <Col>
                      <strong>{order.totalPrice.toFixed(2)}đ</strong>
                    </Col>
                  </Row>
                </ListGroup.Item>
                {!order.isPaid && (
                  <ListGroup.Item>
                    {isPending ? (
                      <LoadingBox />
                    ) : (
                      <div>
                        <PayPalButtons
                          createOrder={createOrder}
                          onApprove={onApprove}
                          onError={onError}
                        ></PayPalButtons>
                      </div>
                    )}
                    {loadingPay && <LoadingBox></LoadingBox>}
                    <div>
                      <button className="vnpay-button-style" onClick={onVnpayClick}>
                        VNPAY
                      </button>
                    </div>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}