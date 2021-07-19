import datetime

from Poem.api.internal_views.utils import get_tenant_resources
from Poem.tenants.models import Tenant
from django_tenants.utils import get_public_schema_name, get_tenant_domain_model
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView

from .utils import error_response


class ListTenants(APIView):
    authentication_classes = (SessionAuthentication,)

    def get(self, request, name=None):
        results = []
        if name:
            if name == 'SuperPOEM_Tenant':
                tenants = Tenant.objects.filter(
                    schema_name=get_public_schema_name()
                )
            else:
                tenants = Tenant.objects.filter(name=name)

            if len(tenants) == 0:
                return Response(
                    {'detail': 'Tenant not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )

        else:
            tenants = Tenant.objects.all()

        for tenant in tenants:
            if tenant.schema_name == get_public_schema_name():
                tenant_name = 'SuperPOEM Tenant'
                metric_key = 'metric_templates'
            else:
                tenant_name = tenant.name
                metric_key = 'metrics'

            try:
                domain = get_tenant_domain_model().objects.get(tenant=tenant)

                data = get_tenant_resources(tenant.schema_name)
                results.append(dict(
                    name=tenant_name,
                    schema_name=tenant.schema_name,
                    domain_url=domain.domain,
                    created_on=datetime.date.strftime(
                        tenant.created_on, '%Y-%m-%d'
                    ),
                    nr_metrics=data[metric_key],
                    nr_probes=data['probes']
                ))

            except get_tenant_domain_model().DoesNotExist:
                return error_response(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail='Domain for tenant {} not found.'.format(tenant_name)
                )

        if name:
            results = results[0]

        else:
            results = sorted(results, key=lambda k: k['name'].lower())

        return Response(results)


class ListPublicTenants(ListTenants):
    authentication_classes = ()
    permission_classes = ()
