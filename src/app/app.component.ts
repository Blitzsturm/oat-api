import { Component } from '@angular/core';
import { DomSanitizer, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { KeyValue } from '@angular/common';
import { oas_core } from '../oas.api';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent
{
	/****************************************************************\
	| Variables
	\****************************************************************/

	public oas: oas_core = new oas_core(this.http);
	public res: string = "";

	public get body():any
	{
		return JSON.parse(this.res);
	}

	public set body(value: any)
	{
		this.res = JSON.stringify(value, null, "    ");
	}

	public get loggedIn()
	{
		return Boolean(this.oas.token);
	}


	/****************************************************************\
	| Internals
	\****************************************************************/

	public constructor(private sanitizer: DomSanitizer, private http: HttpClient)
	{
		globalThis.app = this;
	}

	private async ngOnInit(): Promise<void>
	{
		//await this.apiGet();
	}

	
	public async LoadURL()
	{
		if (this.res != "") this.body = await this.oas.call(this.res);
		else this.body = await this.oas.call();
	}


	

	/****************************************************************\
	|
	\****************************************************************/

	/*
	public loggedIn: boolean = true;
	public toggleLogin(): void
	{
		this.loggedIn = !this.loggedIn;
	}
	*/
}

/****************************************************************\
| Interfaces
\****************************************************************/

interface kvp
{
	[key: string]: any;
} 

interface token
{
	access_token: string;
	expires_in: number;
}

interface database
{
	id: number;
    clientName: string;
    selected: boolean;
    lockDown: string;
    ops: any;
}

interface endpoints2
{
	fullRoute: string;
	methods: endpoints2_method;
}

interface endpoints2_method
{
	verbs: Array<string>;
	security: endpoints2_method_security;
	allowAnonymous: boolean;
}

interface endpoints2_method_security
{

	permissionsAreNotRequired: boolean;
	resourceSecurity: endpoints2_method_security_resourceSecurity;
	roles: string;
	typeId: any,
	users: string;
	allowMultiple: boolean;
}

interface endpoints2_method_security_resourceSecurity
{
	permissionsIsNotRequired: boolean;
	permissions: Array<endpoints2_method_security_resourceSecurity_permissions>;
}

interface endpoints2_method_security_resourceSecurity_permissions
{
	resource: string;
	accessType: string;
}
