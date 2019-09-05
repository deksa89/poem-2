import React, { Component } from 'react';
import {Link} from 'react-router-dom';
import {Backend, WebApi} from './DataManager';
import Autocomplete from 'react-autocomplete';
import {
  LoadingAnim, 
  BaseArgoView, 
  SearchField, 
  DropDown, 
  NotifyOk,
  Icon } from './UIElements';
import ReactTable from 'react-table';
import { Formik, Field, FieldArray, Form } from 'formik';
import 'react-table/react-table.css';
import {
  Button, 
  Row, 
  Col, 
  Label,
  FormGroup,
  FormText} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faSearch } from '@fortawesome/free-solid-svg-icons';

import './MetricProfiles.css'; 


function matchItem(item, value) {
  return item.toLowerCase().indexOf(value.toLowerCase()) !== -1;
}


const ServicesList = ({serviceflavours_all, metrics_all, search_handler,
  remove_handler, insert_handler, onselect_handler, form, remove, insert}) =>
  <table className="table table-bordered table-sm">
    <thead className="table-active">
      <tr>
        <th className="align-middle text-center" style={{width: "5%"}}>#</th>
        <th style={{width: "42.5%"}}><Icon i="serviceflavour"/> Service flavour</th>
        <th style={{width: "42.5%"}}><Icon i='metrics'/> Metric</th>
        <th style={{width: "10%"}}>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr style={{background: "#ECECEC"}}>
        <td className="align-middle text-center">
          <FontAwesomeIcon icon={faSearch}/>
        </td>
        <td>
          <Field 
            type="text" 
            name="search_serviceflavour" 
            required={false}
            className="form-control"
            id="searchServiceFlavour"
            onChange={(e) => search_handler(e, 'view_services',
              'searchServiceFlavour', 'service', 'searchMetric', 'metric')}
            component={SearchField}
          />
        </td>
        <td>
          <Field 
            type="text" 
            name="search_metric" 
            required={false}
            className="form-control"
            id="searchMetric"
            onChange={(e) => search_handler(e, 'view_services', 'searchMetric',
              'metric', 'searchServiceFlavour', 'service')}
            component={SearchField}
          />
        </td>
        <td>
          {''}
        </td>
      </tr>
      {
        form.values.view_services.map((service, index) =>
          <tr>
            <td className={service.isNew ? "bg-light align-middle text-center" : "align-middle text-center"}>
              {index + 1}
            </td>
            <td className={service.isNew ? "bg-light" : ""}>
              <Autocomplete
                inputProps={{
                  className: service.isNew ? "form-control custom-select border border-success" : "form-control custom-select"
                }}
                getItemValue={(item) => item}
                items={serviceflavours_all}
                value={service.service}
                renderItem={(item, isHighlighted) => 
                  <div 
                    key={serviceflavours_all.indexOf(item)} 
                    className={`metricprofiles-autocomplete-entries ${isHighlighted ? 
                        "metricprofiles-autocomplete-entries-highlighted" 
                        : ""}`
                    }>
                    {item ? <Icon i='serviceflavour'/> : ''} {item}
                  </div>}
                onChange={(e) => form.setFieldValue(`view_services.${index}.service`, e.target.value)}
                onSelect={(val) => {
                  form.setFieldValue(`view_services.${index}.service`, val)
                  onselect_handler(form.values.view_services[index], 
                    'service', 
                    val)
                }}
                wrapperStyle={{}}
                shouldItemRender={matchItem}
                renderMenu={(items) => 
                    <div className='metricprofiles-autocomplete-menu' children={items}/>}
              />
            </td>
            <td className={service.isNew ? "bg-light" : ""}>
              <Autocomplete
                inputProps={{
                  className: service.isNew ? "form-control custom-select border border-success" : "form-control custom-select"
                }}
                getItemValue={(item) => item}
                items={metrics_all}
                value={service.metric}
                renderItem={(item, isHighlighted) => 
                  <div 
                    key={metrics_all.indexOf(item)} 
                    className={`metricprofiles-autocomplete-entries ${isHighlighted ? 
                        "metricprofiles-autocomplete-entries-highlighted" 
                        : ""}`
                    }>
                    {item ? <Icon i='metrics'/> : ''} {item}
                  </div>}
                onChange={(e) => form.setFieldValue(`view_services.${index}.metric`, e.target.value)}
                onSelect={(val) => {
                  form.setFieldValue(`view_services.${index}.metric`, val)
                  onselect_handler(form.values.view_services[index],
                    'metric', 
                    val)
                }}
                wrapperStyle={{}}
                shouldItemRender={matchItem}
                renderMenu={(items) => 
                    <div className='metricprofiles-autocomplete-menu' children={items}/>}
              />
            </td>
            <td className="align-middle pl-3">
              <Button size="sm" color="light"
                type="button"
                onClick={() => {
                  remove_handler(form.values.view_services[index]); 
                  return remove(index)
                }}>
                <FontAwesomeIcon icon={faTimes}/>
              </Button>
              <Button size="sm" color="light"
                type="button"
                onClick={() => {
                  let new_element = {index: index + 1, service: '', metric: '', isNew: true}
                  insert_handler(new_element, index + 1, form.values.groups_field, form.values.name )
                  return insert(index + 1, new_element)
                }}>
                <FontAwesomeIcon icon={faPlus}/>
              </Button>
            </td>
          </tr>
        )
      }
    </tbody>
  </table>


export class MetricProfilesChange extends Component 
{
  constructor(props) {
    super(props);

    this.tenant_name = props.tenant_name;
    this.token = props.webapitoken;
    this.webapimetric = props.webapimetric;
    this.profile_name = props.match.params.name;
    this.addview = props.addview
    this.history = props.history;
    this.location = props.location;

    this.state = {
      metric_profile: {},
      metric_profile_name: undefined,
      groups_field: undefined,
      list_user_groups: undefined,
      view_services: undefined,
      list_services: undefined,
      write_perm: false,
      serviceflavours_all: undefined,
      metrics_all: undefined,
      areYouSureModal: false,
      loading: false,
      modalFunc: undefined,
      modalTitle: undefined,
      modalMsg: undefined,
      searchServiceFlavour: "",
      searchMetric: ""
    }

    this.backend = new Backend();
    this.webapi = new WebApi({
      token: props.webapitoken,
      metricProfiles: props.webapimetric}
    )

    this.toggleAreYouSure = this.toggleAreYouSure.bind(this);
    this.toggleAreYouSureSetModal = this.toggleAreYouSureSetModal.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.onRemove = this.onRemove.bind(this);
    this.onInsert = this.onInsert.bind(this);
    this.onSelect = this.onSelect.bind(this);
  }

  flattenServices(services) {
    let flat_services = [];
    let index = 0;

    services.forEach((service_element) => {
      let service = service_element.service;
      service_element.metrics.forEach((metric) => {
        flat_services.push({index, service, metric})
        index += 1;
      })
    })

    return flat_services
  }

  componentDidMount() {
    this.setState({loading: true})

    if (!this.addview) {
      this.backend.fetchMetricProfileIdFromName(this.profile_name).then(id =>
        Promise.all([this.webapi.fetchMetricProfile(id),
          this.backend.fetchMetricProfileUserGroups(),
          this.backend.fetchServiceFlavoursAll(),
          this.backend.fetchMetricsAll()
        ])
        .then(([metricp, usergroups, serviceflavoursall, metricsall]) => {
          this.backend.fetchMetricProfileGroup(metricp.name)
            .then(group => {
              this.setState(
                {
                  metric_profile: metricp,
                  metric_profile_name: metricp.name,
                  groups_field: group,
                  list_user_groups: usergroups,
                  write_perm: localStorage.getItem('authIsSuperuser') === 'true' || usergroups.indexOf(group) >= 0,
                  view_services: this.flattenServices(metricp.services).sort(this.sortServices),
                  serviceflavours_all: serviceflavoursall,
                  metrics_all: metricsall,
                  list_services: this.flattenServices(metricp.services).sort(this.sortServices),
                  loading: false
                });
            }) 
        }))
    } 
    else if (this.addview) {
      let empty_metric_profile = {
        id: '',
        name: '',
        services: [],
      }
      Promise.all([this.backend.fetchMetricProfileUserGroups(),
        this.backend.fetchServiceFlavoursAll(),
        this.backend.fetchMetricsAll()
      ])
      .then(([usergroups, serviceflavoursall, metricsall]) => {
        this.setState(
          {
            metric_profile: empty_metric_profile,
            metric_profile_name: '',
            groups_field: '',
            list_user_groups: usergroups,
            write_perm: true,
            view_services: [{service: '', metric: '', index: 0, isNew: true}],
            serviceflavours_all: serviceflavoursall,
            metrics_all: metricsall,
            list_services: [{service: '', metric: '', index: 0, isNew: true}],
            loading: false
          })
        })
    }
  }

  insertSelectPlaceholder(data, text) {
    if (data) {
      return [text, ...data]
    } else
      return [text] 
  }

  toggleAreYouSureSetModal(msg, title, onyes) {
    this.setState(prevState => 
      ({areYouSureModal: !prevState.areYouSureModal,
        modalFunc: onyes,
        modalMsg: msg,
        modalTitle: title,
      }));
  }

  toggleAreYouSure() {
    this.setState(prevState => 
      ({areYouSureModal: !prevState.areYouSureModal}));
  }

  sortServices(a, b) {
    if (a.service.toLowerCase() < b.service.toLowerCase()) return -1;
    if (a.service.toLowerCase() > b.service.toLowerCase()) return 1;
    if (a.service.toLowerCase() === b.service.toLowerCase()) {
      if (a.metric.toLowerCase() < b.metric.toLowerCase()) return -1;
      if (a.metric.toLowerCase() > b.metric.toLowerCase()) return 1;
      if (a.metric.toLowerCase() === b.metric.toLowerCase()) return 0;
    }
  }

  handleSearch(e, statefieldlist, statefieldsearch, formikfield,
    alternatestatefield, alternateformikfield) {
    let filtered = this.state[statefieldlist.replace('view_', 'list_')]
    let tmp_list_services = [...this.state.list_services];

    if (this.state[statefieldsearch].length > e.target.value.length) {
      // handle remove of characters of search term
      filtered = this.state[statefieldlist.replace('view_', 'list_')].
        filter((elem) => matchItem(elem[formikfield], e.target.value))

      // reindex after back to full list view
      let index_update = 0
      tmp_list_services.forEach((element) => {
        element.index = index_update;
        index_update += 1;
      })

      tmp_list_services.sort(this.sortServices);
    }
    else if (e.target.value !== '') {
      filtered = this.state[statefieldlist].filter((elem) => 
        matchItem(elem[formikfield], e.target.value))
    }

    // handle multi search 
    if (this.state[alternatestatefield].length) {
      filtered = filtered.filter((elem) => 
        matchItem(elem[alternateformikfield], this.state[alternatestatefield]))
    }

    filtered.sort(this.sortServices);

    this.setState({
      [`${statefieldsearch}`]: e.target.value, 
      [`${statefieldlist}`]: filtered,
      list_services: tmp_list_services
    })
  }

  onInsert(element, i, group, name) {
    // full list of services
    if (this.state.searchServiceFlavour === '' 
      && this.state.searchMetric === '') {
      let service = element.service;
      let metric = element.metric;

      let tmp_list_services = [...this.state.list_services];
      // split list into two preserving original
      let slice_left_tmp_list_services = [...tmp_list_services].slice(0, i);
      let slice_right_tmp_list_services = [...tmp_list_services].slice(i);

      slice_left_tmp_list_services.push({index: i, service, metric, isNew: true});

      // reindex first slice 
      let index_update = 0;
      slice_left_tmp_list_services.forEach((element) => {
        element.index = index_update;
        index_update += 1;
      })

      // reindex rest of list
      index_update = slice_left_tmp_list_services.length;
      slice_right_tmp_list_services.forEach((element) => {
        element.index = index_update;
        index_update += 1;
      })

      // concatenate two slices
      tmp_list_services = [...slice_left_tmp_list_services, ...slice_right_tmp_list_services];

      this.setState({
        list_services: tmp_list_services,
        view_services: tmp_list_services,
        groups_field: group,
        metric_profile_name: name
      });
    } 
    // subset of matched elements of list of services
    else {
      let tmp_view_services = [...this.state.view_services];
      let tmp_list_services = [...this.state.list_services];

      let slice_left_view_services = [...tmp_view_services].slice(0, i)
      let slice_right_view_services = [...tmp_view_services].slice(i)

      slice_left_view_services.push({...element, isNew: true});

      let index_update = 0;
      slice_left_view_services.forEach((element) => {
        element.index = index_update;
        index_update += 1;
      })
      
      index_update = i + 1;
      slice_right_view_services.forEach((element) => {
        element.index = index_update;
        index_update += 1;
      })

      tmp_list_services.push({...element, isNew: true})

      this.setState({
        view_services: [...slice_left_view_services, ...slice_right_view_services],
        list_services: tmp_list_services, 
      });
    }
  }

  onSubmitHandle({formValues, servicesList}, action) {
    let msg = undefined;
    let title = undefined;

    if (this.addview) {
      msg = 'Are you sure you want to add Metric profile?'
      title = 'Add metric profile'
    }
    else {
      msg = 'Are you sure you want to change Metric profile?'
      title = 'Change metric profile'
    }
    this.toggleAreYouSureSetModal(msg, title,
      () => this.doChange({formValues, servicesList}, action));
  }

  groupMetricsByServices(servicesFlat) {
    let services = [];

    servicesFlat.forEach(element => {
      let service = services.filter(e => e.service === element.service);
      if (!service.length)
        services.push({
          'service': element.service,
          'metrics': [element.metric]
        })
      else
        service[0].metrics.push(element.metric)
       
    })
    return services
  }

  doChange({formValues, servicesList}, actions) {
    let services = [];
    let dataToSend = [];

    if (!this.addview) {
      const {id, name} = this.state.metric_profile
      services = this.groupMetricsByServices(servicesList);
      dataToSend = {id, name, services};
      this.webapi.changeMetricProfile(dataToSend)
      .then(response => {
        if (!response.ok) {
          this.toggleAreYouSureSetModal(`Error: ${response.status}, ${response.statusText}`, 
            'Error changing metric profile', 
            undefined)
        }
        else {
          response.json()
          .then(r => {
            this.backend.changeMetricProfile({ 
              apiid: dataToSend.id, 
              name: dataToSend.name, 
              groupname: formValues.groups_field
            })
              .then(() => NotifyOk({
                msg: 'Metric profile succesfully changed',
                title: 'Changed',
                callback: () => this.history.push('/ui/metricprofiles')
              },
              ))
              .catch(err => alert('Something went wrong: ' + err))
          })
          .catch(err => alert('Something went wrong: ' + err))
        }
      }).catch(err => alert('Something went wrong: ' + err))
    } 
    else {
      services = this.groupMetricsByServices(servicesList);
      dataToSend = {name: formValues.name, services};
      this.webapi.addMetricProfile(dataToSend)
      .then(response => {
        if (!response.ok) {
          this.toggleAreYouSureSetModal(`Error: ${response.status}, ${response.statusText}`,
            'Error adding metric profile',
            undefined)
        } 
        else {
          response.json()
          .then(r => { 
            this.backend.addMetricProfile({
              apiid: r.data.id, 
              name: dataToSend.name, 
              groupname: formValues.groups_field 
            })
              .then(() => NotifyOk({
                msg: 'Metric profile successfully added',
                title: 'Added',
                callback: () => this.history.push('/ui/metricprofiles')
              }))
              .catch(err => alert('Something went wrong: ' + err))
          })
          .catch(err => alert('Something went wrong: ' + err))
        }
      }).catch(err => alert('Something went wrong: ' + err))
    }
  }

  doDelete(idProfile) {
    this.webapi.deleteMetricProfile(idProfile)
    .then(response => {
      if (!response.ok) {
        alert(`Error: ${response.status}, ${response.statusText}`)
      } else {
        response.json()
        .then(this.backend.deleteMetricProfile(idProfile))
        .then(
          () => NotifyOk({
            msg: 'Metric profile sucessfully deleted',
            title: 'Deleted',
            callback: () => this.history.push('/ui/metricprofiles')
          }))
      }
    }).catch(err => alert('Something went wrong: ' + err))
  }

  onSelect(element, field, value) {
    let index = element.index;
    let tmp_list_services = [...this.state.list_services];
    let tmp_view_services = [...this.state.view_services];
    let new_element = tmp_list_services.findIndex(service => 
      service.index === index && service.isNew === true)

    if (new_element >= 0 ) 
      tmp_list_services[new_element][field] = value;
    else
      tmp_list_services[index][field] = value;

    for (var i = 0; i < tmp_view_services.length; i++)
      if (tmp_view_services[i].index === index)
        tmp_view_services[i][field] = value

    this.setState({
      list_services: tmp_list_services,
      view_services: tmp_view_services
    });
  }

  onRemove(element) {
    // XXX: this means no duplicate elements allowed
    let index = this.state.list_services.findIndex(service => 
      element.index === service.index &&
      element.service === service.service &&
      element.metric === service.metric
    );
    let index_tmp = this.state.view_services.findIndex(service => 
      element.index === service.index &&
      element.service === service.service &&
      element.metric === service.metric
    );

    if (index >= 0 && index_tmp >= 0) {
      let tmp_list_services = [...this.state.list_services]
      let tmp_view_services = [...this.state.view_services]
      tmp_list_services.splice(index, 1)
      tmp_view_services.splice(index_tmp, 1)

      // reindex rest of list
      for (var i = index; i < tmp_list_services.length; i++) {
        let element_index = tmp_list_services[i].index
        tmp_list_services[i].index = element_index - 1;
      }
      this.setState({
        list_services: tmp_list_services,
        view_services: tmp_view_services
      });
    }
  }

  render() {
    const {write_perm, loading, metric_profile, metric_profile_name,
      view_services, groups_field, list_user_groups,
      serviceflavours_all, metrics_all, 
      searchMetric, searchServiceFlavour} = this.state;

    if (loading)
      return (<LoadingAnim />) 

    else if (!loading && metric_profile && view_services) {
      return (
        <BaseArgoView
          resourcename='Metric profile'
          location={this.location}
          addview={this.addview}
          modal={true}
          state={this.state}
          toggle={this.toggleAreYouSure}
          submitperm={write_perm}>
          <Formik
            initialValues = {{
              id: metric_profile.id,
              name: metric_profile_name,
              groups_field: groups_field,
              view_services: view_services,
              search_metric: searchMetric,
              search_serviceflavour: searchServiceFlavour
            }}
            onSubmit = {(values, actions) => this.onSubmitHandle({
              formValues: values,
              servicesList: this.state.list_services 
            }, actions)}
            enableReinitialize={true}
            render = {props => (
              <Form>
                <FormGroup>
                  <Row>
                    <Col md={4}>
                      <Label for="metricProfileName">Metric profile name:</Label>
                      <Field 
                        type="text" 
                        name="name" 
                        placeholder="Name of metric profile"
                        required={true}
                        className="form-control form-control-lg"
                        id="metricProfileName"
                      />
                    </Col>
                  </Row>
                </FormGroup>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Row>
                        <Col md={6}>
                          <Label>Group: </Label>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={4}>
                          <Field 
                            name="groups_field"
                            component={DropDown} 
                            data={this.insertSelectPlaceholder(
                              (write_perm) ?
                                list_user_groups :
                                [groups_field, ...list_user_groups]
                            )}
                            required={true}
                            class_name='custom-select'
                          /> 
                        </Col>
                      </Row>
                      <Row>
                        <Col md={12}>
                          <FormText>
                            Metric profile is a member of a given group. 
                          </FormText>
                        </Col>
                      </Row>
                    </FormGroup>
                  </Col>
                </Row>
                <h4 className="mt-2 alert-info p-1 pl-3 text-light text-uppercase rounded" style={{'backgroundColor': "#416090"}}>Metric instances</h4>
                <FieldArray
                  name="view_services"
                  render={props => (
                    <ServicesList
                      {...props}
                      serviceflavours_all={this.insertSelectPlaceholder(serviceflavours_all, '')}
                      metrics_all={this.insertSelectPlaceholder(metrics_all, '')}
                      search_handler={this.handleSearch}
                      remove_handler={this.onRemove}
                      insert_handler={this.onInsert}
                      onselect_handler={this.onSelect}
                    />)}
                />
                {
                  (write_perm) &&
                    <div className="submit-row d-flex align-items-center justify-content-between bg-light p-3 mt-5">
                      <Button
                        color="danger"
                        onClick={() => {
                          this.toggleAreYouSureSetModal('Are you sure you want to delete Metric profile?', 
                            'Delete metric profile',
                            () => this.doDelete(props.values.id))
                        }}>
                        Delete
                      </Button>
                      <Button color="success" id="submit-button" type="submit">Save</Button>
                    </div>
                }
              </Form>
            )} 
          />
        </BaseArgoView>
      )
    }
    else 
      return null
  }
}


export class MetricProfilesList extends Component
{
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      list_metricprofiles: null
    }

    this.location = props.location;
    this.backend = new Backend();
  }

  componentDidMount() {
    this.setState({loading: true})
    this.backend.fetchMetricProfiles()
      .then(json =>
        this.setState({
          list_metricprofiles: json, 
          loading: false})
      )
  }

  render() {
    const columns = [
      {
        Header: 'Name',
        id: 'name',
        accessor: e => 
        <Link to={'/ui/metricprofiles/' + e.name}>
          {e.name}
        </Link>
      },
      {
        Header: 'Group',
        accessor: 'groupname',
        maxWidth: 150,
      }
    ]
    const {loading, list_metricprofiles} = this.state

    if (loading) 
      return (<LoadingAnim />)

    else if (!loading && list_metricprofiles) {
      return (
        <BaseArgoView 
          resourcename='metric profile'
          location={this.location}
          listview={true}>
          <ReactTable
            data={list_metricprofiles}
            columns={columns}
            className="-striped -highlight"
            defaultPageSize={12}
          />
        </BaseArgoView>
      )
    }
    else 
      return null
  }
}