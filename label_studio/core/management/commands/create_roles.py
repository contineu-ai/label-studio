import logging

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from core.permissions import all_permissions
from users.models import UserRole

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Create roles with predefined permissions'

    def handle(self, *args, **options):
        roles = {
            UserRole.REVIEWER.value: (
                all_permissions.projects_create,
                all_permissions.projects_view,
                all_permissions.projects_change,
                all_permissions.projects_delete,
                all_permissions.tasks_create,
                all_permissions.tasks_view,
                all_permissions.tasks_change,
                all_permissions.tasks_delete,
                all_permissions.annotations_create,
                all_permissions.annotations_view,
                all_permissions.annotations_change,
                all_permissions.annotations_delete,
            ),
            UserRole.ANNOTATOR.value: (
                all_permissions.projects_view,
                all_permissions.annotations_create,
                all_permissions.annotations_view,
                all_permissions.annotations_change,
                all_permissions.annotations_delete,
            ),
        }
        for role, permission_model_and_codenames in roles.items():
            group, created = Group.objects.get_or_create(name=role)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Role: {role} created!'))
            else:
                self.stdout.write(self.style.WARNING(f'Role: {role} already exists!'))

            group.permissions.clear()

            for model_and_codename in permission_model_and_codenames:
                model, codename = model_and_codename.split('.')
                # print(f'model value={model} & type={type(model)}')
                # print(f'codename value={codename} & type={type(codename)}')
                permission = Permission.objects.get(codename=codename)
                group.permissions.add(permission)
                self.stdout.write(self.style.SUCCESS(f'Role: {role} - Permission: {codename} added!'))
