import logging

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from core.permissions import all_permissions
from projects.models import Project
from tasks.models import Task

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Create permissions, includes permissions not included automatically created by django'

    def _create_project_state_change_permissions(self):
        content_type = ContentType.objects.get_for_model(model=Project)
        Permission.objects.get_or_create(
            codename=all_permissions.projects_change_state_to_annotating.split('.')[1],
            content_type=content_type,
            name='Can change project state to annotating',
        )
        Permission.objects.get_or_create(
            codename=all_permissions.projects_change_state_to_reviewing.split('.')[1],
            content_type=content_type,
            name='Can change project state to reviewing',
        )
        Permission.objects.get_or_create(
            codename=all_permissions.projects_change_state_to_reviewed.split('.')[1],
            content_type=content_type,
            name='Can change project state to reviewed',
        )
        Permission.objects.get_or_create(
            codename=all_permissions.projects_change_state_to_completed.split('.')[1],
            content_type=content_type,
            name='Can change project state to completed',
        )
        Permission.objects.get_or_create(
            codename=all_permissions.projects_change_state_to_scraped.split('.')[1],
            content_type=content_type,
            name='Can change project state to scraped',
        )


    def _create_task_state_change_permissions(self):
        content_type = ContentType.objects.get_for_model(model=Task)
        Permission.objects.get_or_create(
            codename=all_permissions.tasks_change_state_to_pending_annotation.split('.')[1],
            content_type=content_type,
            name='Can change task state to pending-annotation'
        )
        Permission.objects.get_or_create(
            codename=all_permissions.tasks_change_state_to_pending_review.split('.')[1],
            content_type=content_type,
            name='Can change task state to pending-review'
        )
        Permission.objects.get_or_create(
            codename=all_permissions.tasks_change_state_to_approved.split('.')[1],
            content_type=content_type,
            name='Can change task state to approved'
        )
        Permission.objects.get_or_create(
            codename=all_permissions.tasks_change_state_to_rejected.split('.')[1],
            content_type=content_type,
            name='Can change task state to rejected'
        )


    def handle(self, *args, **options):
        self._create_project_state_change_permissions()
        self._create_task_state_change_permissions()
        self.stdout.write(self.style.SUCCESS('Permissions created successfully'))
