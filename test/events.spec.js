describe('Events', function () {
  var component, stubs;

  var TestUtils = React.addons.TestUtils;

  function stub (name) {
    return stubs[name] = sinon.stub();
  }

  beforeEach(function () {
    stubs = {};

    component = TestUtils.renderIntoDocument(React.createElement(
      'div',
      {
        onClick: stub('div')
      },
      React.createElement('a', {
        onClick: stubs.a = sinon.spy(function (event) {
          event.stopPropagation();
        })
      }),
      React.createElement('button', {
        className: 'first-button',
        onClick: stub('button1')
      }),
      React.createElement('button', {
        className: 'second-button',
        onClick: stub('button2')
      })
    ));
  });

  describe('#click on top-level component', function () {
    beforeEach(function () {
      $R(component).click();
    });

    it('calls the div onClick handler', function () {
      expect(stubs.div).to.have.been.called;
    });

    it('does not call any other handler', function () {
      expect(stubs.a).to.not.have.been.called;
      expect(stubs.button1).to.not.have.been.called;
      expect(stubs.button2).to.not.have.been.called;
    });
  });

  describe('#click on a tag component', function () {
    beforeEach(function () {
      $R(component, 'button').click();
    });

    it('calls the button1 onClick handler', function () {
      expect(stubs.button1).to.have.been.called;
    });

    it('calls the button2 onClick handler', function () {
      expect(stubs.button2).to.have.been.called;
    });

    it('bubbles up to the div onClick handler', function () {
      expect(stubs.div).to.have.been.called;
    });
  });

  describe('#click that stops bubbling', function () {
    beforeEach(function () {
      $R(component, 'a').click();
    });

    it('calls the a onClick handler', function () {
      expect(stubs.a).to.have.been.called;
    });

    it('does not bubble up to the div onClick handler', function () {
      expect(stubs.div).to.not.have.been.called;
    });
  });
});
