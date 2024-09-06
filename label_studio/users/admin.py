"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
from core.models import AsyncMigrationStatus
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from ml.models import MLBackend, MLBackendTrainJob
from organizations.models import Organization, OrganizationMember
from projects.models import Project
from tasks.models import Annotation, Prediction, Task
from users.models import User
from django import forms
from django.contrib.auth.forms import ReadOnlyPasswordHashField


class ChangeUserAdminForm(forms.ModelForm):


    password = ReadOnlyPasswordHashField(
        label="Password",
        help_text='''
            Raw passwords are not stored, so there is no way to see this
            user’s password, but you can change the password using
            <a href="{}">this form</a>.
        ''',
    )

    class Meta:
        model = User
        # fields = '__all__'
        fields = ('password', 'email', 'username', 'first_name', 'last_name', 'is_active', 'is_staff')

class UserAdminShort(UserAdmin):

    add_fieldsets = ((None, {'fields': ('email', 'password1', 'password2')}),)

    form = ChangeUserAdminForm

    def __init__(self, *args, **kwargs):
        super(UserAdminShort, self).__init__(*args, **kwargs)

        self.list_display = (
            'email',
            'username',
            'active_organization',
            'organization',
            'is_staff',
            'is_superuser',
        )
        self.list_filter = ('is_staff', 'is_superuser', 'is_active')
        self.search_fields = (
            'username',
            'first_name',
            'last_name',
            'email',
            'organization__title',
            'active_organization__title',
        )
        self.ordering = ('email',)

        self.fieldsets = (
            (None, {'fields': ('password',)}),
            ('Personal info', {'fields': ('email', 'username', 'first_name', 'last_name')}),
            (
                'Special roles',
                {
                    'classes': ('collapse',),
                    'fields': (
                        'is_active',
                        'is_staff',
                        'is_superuser',
                    )
                },
            ),
            (
                'Groups And Permissions',
                {
                    'classes': ('collapse',),
                    'fields': ('groups', 'user_permissions'),
                },
            ),
            ('Important dates', {'fields': ('last_login', 'date_joined')}),
        )

        self.readonly_fields = ('last_login', 'date_joined')


class AsyncMigrationStatusAdmin(admin.ModelAdmin):
    def __init__(self, *args, **kwargs):
        super(AsyncMigrationStatusAdmin, self).__init__(*args, **kwargs)

        self.list_display = ('id', 'name', 'project', 'status', 'created_at', 'updated_at', 'meta')
        self.list_filter = ('name', 'status')
        self.search_fields = ('name', 'project__id')
        self.ordering = ('id',)


class OrganizationMemberAdmin(admin.ModelAdmin):
    def __init__(self, *args, **kwargs):
        super(OrganizationMemberAdmin, self).__init__(*args, **kwargs)

        self.list_display = ('id', 'user', 'organization', 'created_at', 'updated_at')
        self.search_fields = ('user__email', 'organization__title')
        self.ordering = ('id',)


admin.site.register(User, UserAdminShort)
admin.site.register(Project)
admin.site.register(MLBackend)
admin.site.register(MLBackendTrainJob)
admin.site.register(Task)
admin.site.register(Annotation)
admin.site.register(Prediction)
admin.site.register(Organization)
admin.site.register(OrganizationMember, OrganizationMemberAdmin)
admin.site.register(AsyncMigrationStatus, AsyncMigrationStatusAdmin)


# remove unused django groups
# admin.site.unregister(Group)
