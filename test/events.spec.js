describe('Events', function () {
  var component, spies;

  var TestUtils = React.addons.TestUtils;

  function spy (name) {
    return spies[name] = sinon.spy();
  }

  beforeEach(function () {
    spies = {};

    spy('checkbox');

    component = TestUtils.renderIntoDocument(React.createElement(
      'div',
      {
        onClick: spy('div')
      },
      React.createElement('a', {
        onClick: spies.a = sinon.spy(function (event) {
          event.stopPropagation();
        })
      }),
      React.createElement('button', {
        className: 'first-button',
        onClick: spy('button1')
      }),
      React.createElement('button', {
        className: 'second-button',
        onClick: spy('button2')
      }),
      React.createElement('input', {
        type: 'checkbox',
        checked: false,
        onChange: function (event) {
          spies.checkbox(event.target.checked);
        }
      }),
      React.createElement('select', {
        disabled: true,
        onClick: spy('select')
      })
    ));

    this.$r = $R(component);
  });

  describe('#click on top-level component', function () {
    beforeEach(function () {
      this.$r.click();
    });

    it('calls the div onClick handler', function () {
      expect(spies.div).to.have.been.called;
    });

    it('does not call any other handler', function () {
      expect(spies.a).to.not.have.been.called;
      expect(spies.button1).to.not.have.been.called;
      expect(spies.button2).to.not.have.been.called;
    });
  });

  describe('#click on a tag component', function () {
    beforeEach(function () {
      this.$r.find('button').click();
    });

    it('calls the button1 onClick handler', function () {
      expect(spies.button1).to.have.been.called;
    });

    it('calls the button2 onClick handler', function () {
      expect(spies.button2).to.have.been.called;
    });

    it('bubbles up to the div onClick handler', function () {
      expect(spies.div).to.have.been.called;
    });
  });

  describe('#click that stops bubbling', function () {
    beforeEach(function () {
      this.$r.find('a').click();
    });

    it('calls the a onClick handler', function () {
      expect(spies.a).to.have.been.called;
    });

    it('does not bubble up to the div onClick handler', function () {
      expect(spies.div).to.not.have.been.called;
    });
  });

  describe('#ensureClick', function () {
    describe('when 0 components are found', function () {
      it('throws an error', function () {
        expect(function () {
          this.$r.find('h1').ensureClick();
        }.bind(this)).to.throw('Called ensureClick, but current context has 0 components. ensureClick only works when 1 component is present.');
      });
    });

    describe('when 2 components are found', function () {
      it('throws an error', function () {
        expect(function () {
          this.$r.find('button').ensureClick();
        }.bind(this)).to.throw('Called ensureClick, but current context has 2 components. ensureClick only works when 1 component is present.');
      });
    });

    describe('when 1 component is found', function () {
      it('clicks the component', function () {
        this.$r.find('a').ensureClick();
        expect(spies.a).to.have.been.called;
      });
    });

    describe('when component is disabled', function () {
      it('throws an error', function () {
        expect(function () {
          this.$r.find('select').ensureClick();
        }.bind(this)).to.throw('Called ensureClick, but the targeted element is disabled.');
      });

      it('does not click the component', function () {
        expect(spies.select).to.not.have.been.called;
      });
    });
  });

  describe('#ensureToggleCheckbox', function () {
    describe('when 0 components are found', function () {
      it('throws an error', function () {
        expect(function () {
          this.$r.find('h1').ensureToggleCheckbox();
        }.bind(this)).to.throw('Called ensureToggleCheckbox, but current context has 0 components. ensureToggleCheckbox only works when 1 component is present.');
      });
    });

    describe('when 2 components are found', function () {
      it('throws an error', function () {
        expect(function () {
          this.$r.find('button').ensureToggleCheckbox();
        }.bind(this)).to.throw('Called ensureToggleCheckbox, but current context has 2 components. ensureToggleCheckbox only works when 1 component is present.');
      });
    });

    describe('when 1 component is found', function () {
      it('clicks the component', function () {
        expect(this.$r.find('input').nodes()[0].checked).to.be.false;
        this.$r.find('input').ensureToggleCheckbox();
        expect(spies.checkbox).to.have.been.calledWith(true);
      });
    });
  });
});
