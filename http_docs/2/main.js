var j$ = jQuery.noConflict();
var RemoteResult; //global var of final results
var salesforceAccessURL = ''; //if value then links will use frontdoor.jsp on links to SalesForce pages
var fontawesomeloadIcon = "fa fa-spinner fa-pulse fa-3x fa-fw";
var jsforceAPIVersion = '36.0';
var myconn;
var finalresult = [];
var editor;
var homeurl ='/FX_Resourse_Editor/test.htm';

//IE support
if (!String.prototype.startsWith)
{
	String.prototype.startsWith = function(searchString, position)
	{
		position = position || 0;
		return this.substr(position, searchString.length) === searchString;
	};
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}


/******************Event Handlers *************************************/

	function DoOathLoginLogin()
	{
		var myenv = j$('#id_environment').val();
		if (myenv != '')
		{
			j$('.loading').show();
			var oauth2 = GetOauth(myenv);
			var rurl =  oauth2.getAuthorizationUrl({scope: 'full', state:myenv});
			window.location.replace(rurl);
		}
	}
	
	function OnSelectChange(sel)
	{
		j$("#texteditor").hide();
		j$("#jsoneditor").hide();
		var value = sel.value;
		var ffound = false;
		if (sel && sel != '' && RemoteResult && RemoteResult.length > 0)
		{
			for (var ir1 = 0; ir1 < RemoteResult.length; ir1++)
			{
				var Result = RemoteResult[ir1];
				if (Result.Name == sel)
				{
					currentSelectedName = sel;
					currentSelected = Result;
					console.log(currentSelected);
					if (sel == 'FX_Mobile_Filters' || sel == 'FX_Mobile_Rules')
					{
						
						if (!editor)
						{
							var container = document.getElementById("jsoneditor");
					        var options = {
							    mode: 'tree',
							    modes: ['code', 'form', 'text', 'tree', 'view'], // allowed modes
							    onError: function (err) {
							      alert(err.toString());
							    },
							    onModeChange: function (newMode, oldMode) {
							      //console.log('Mode switched from', oldMode, 'to', newMode);
							    },
							    onError: function (err) {
							      alert(err);
							    },
							    onChange: function()
							    {
							    	 if(editor.getText() === currenteditorvalue)
									  {
									  	j$('#sel1').removeAttr('disabled');
									    j$("#bntcancel").hide();
									    j$("#bntsave").hide();
									  } 
									  else 
									  {
									  	j$('#sel1').attr('disabled','disabled');
									    j$("#bntcancel").show();
									    j$("#bntsave").show();
									  }
							    }
							  };
						   	
						   	editor = new JSONEditor(container, options);
						}
						var jsondata = getJsonData(Result.Body);
						var validerrors = ''
						{
							try 
							{
							 	var c = j$.parseJSON(jsondata);
							}
							catch (err) 
							{
							  	validerrors = err;
							}
						}
					
						if (validerrors != '')
						{
						 	alert('You must fix valadation errors: ' + validerrors);
						 	j$("#texteditor").show();
						 	currenteditorType = 'text';
						 	currenteditorvalue = Result.Body;
							j$("#texteditor").val(Result.Body);
						}
						else
						{
							currenteditorType = 'json';
							currenteditorvalue = jsondata;
					        editor.setText(jsondata);
							j$("#jsoneditor").show();
						}
				    }
				    else
				    {
				    	currenteditorType = 'text';
				    	j$("#texteditor").show();
				    	currenteditorvalue = Result.Body;
						j$("#texteditor").val(Result.Body);
					}
					ffound = true;
				}
			}

		}
		if (ffound == false)
		{
			j$("#content").val('');
		}
	}

	function docancel()
	{
		if (currenteditorType == 'text')
		{
			j$("#texteditor").val(currenteditorvalue);
			j$('#sel1').removeAttr('disabled');
		    j$("#bntcancel").hide();
		    j$("#bntsave").hide();
		}
		if (currenteditorType == 'json')
		{
			editor.setText(currenteditorvalue);
			j$('#sel1').removeAttr('disabled');
			j$("#bntcancel").hide();
			j$("#bntsave").hide();
		}
	}

	function dosave()
	{
		if (currentSelected && currentSelected.Metadetail && currentSelected.Metadetail.StaticResource)
		{
			var metadata;
			var sourcetxt = '';
			var savesourcetxt = '';
			var mydescription = (currentSelected.Metadetail.StaticResource.description != undefined && currentSelected.Metadetail.StaticResource.description != 'undefined' ? currentSelected.Metadetail.StaticResource.description : '');
			if (currenteditorType == 'text')
			{
				sourcetxt = j$("#texteditor").val();
				savesourcetxt = sourcetxt;
				var mycontent = window.btoa(sourcetxt);//base64 encode
				var metadata = [{cacheControl:currentSelected.Metadetail.StaticResource.cacheControl, content:mycontent,contentType:currentSelected.Metadetail.StaticResource.contentType,description:mydescription,fullName:currentSelectedName}]
			}
			if (currenteditorType == 'json')
			{
				sourcetxt = editor.getText();
				var jsondata = sourcetxt;
				if (currentSelectedName == 'FX_Mobile_Filters' )
				{
					jsondata = 'window.FX_Mobile_Filters =' + jsondata
				}
				if (currentSelectedName == 'FX_Mobile_Rules' )
				{
					jsondata = 'window.FX_Mobile_Rules =' + jsondata
				}
				savesourcetxt = jsondata;
				var mycontent = window.btoa(jsondata);//base64 encode
				var metadata = [{cacheControl:currentSelected.Metadetail.StaticResource.cacheControl, content:mycontent,contentType:currentSelected.Metadetail.StaticResource.contentType,description:mydescription,fullName:currentSelectedName}]
			}

			if (metadata)
			{
				console.log(metadata);
				j$("#MainDetail").LoadingOverlay("show",{image : "",fontawesome : fontawesomeloadIcon});
				myconn.metadata.upsert('StaticResource', metadata, function(err, results) 
				{
					j$("#MainDetail").LoadingOverlay("hide");
					if (err) 
					{ 
						alert(err);
						console.error(err); 
					}
					else
					{
						var success = false;
						if (Array.isArray(results) )
						{
							for (var i=0; i < results.length; i++) 
							{
								var result = results[i];
								console.log('success ? : ' + result.success);
								console.log('created ? : ' + result.created);
								console.log('fullName : ' + result.fullName);
								success = result.success;
							}
						}
						else
						{
							var result = results;
							console.log('success ? : ' + result.success);
							console.log('created ? : ' + result.created);
							console.log('fullName : ' + result.fullName);
							success = result.success;
						}
					}
					if (success == true)
					{
						currenteditorvalue = sourcetxt;
						j$('#sel1').removeAttr('disabled');
					    j$("#bntcancel").hide();
					    j$("#bntsave").hide();
					    currentSelected.Body = savesourcetxt;
					}
					else
					{
						alert("Error saving Staticesource");
					}
					
				});
			}
		}

	}

	function logout()
	{
		if (myconn)
		{
			j$("#MainDetail").LoadingOverlay("show",{image : "",fontawesome : fontawesomeloadIcon});
			myconn.logout(function(err) 
			{
				j$("#MainDetail").LoadingOverlay("hide");
				if (err) 
				{ 
					ProcessError(err); 
				}
				window.location.replace(homeurl);
			});
		}
		else
		{
			window.location.replace(homeurl);
		}
	}

	function ViewInSalesForce()
	{
		if (myconn)
		{
			window.open(salesforceAccessURL);
		}
	}


/******************END Event Handlers *************************************/



var currenteditorvalue = '';
var currenteditorType = '';
var currentSelectedName = '';
var currentSelected;

j$(document).ready(function()
{
    var mycode = getParameterName('code',document.location.search);
    var mystate = getParameterName('state',document.location.search);
    if (mycode && mystate)
    {
    	j$("#MainDetail").LoadingOverlay("show",{image : "",fontawesome : fontawesomeloadIcon});
    	var conn = new jsforce.Connection({oauth2: GetOauth(mystate)});
	    conn.authorize(mycode, function(err, userInfo) 
	    {
	        if (err) 
        	{ 
        		ProcessError(err);
        		window.location.replace(homeurl);
        		j$("#MainDetail").LoadingOverlay("hide");
        		j$('#logindiv').show();
        	}
        	else
        	{
        		

        		j$('#logindiv').hide();
        		j$('#mainContent').show();

        		var myOrgId = '';

        		console.log('Access Token: ' + conn.accessToken);
		        console.log('Instance URL: ' + conn.instanceUrl);
		        console.log('User ID: ' + userInfo.id);
		        console.log('Org ID: ' + userInfo.organizationId);
		        myOrgId = userInfo.organizationId;
		        myuserid = userInfo.id;
		        //j$('#username').html(userInfo.id);
		        //j$('#loginDetails').show();

		        {
					mysessionId = conn.accessToken;
					var myconnoptions = {
					  sessionId : conn.accessToken,
					  serverUrl : conn.instanceUrl,
					};

					var proxyurl = getParameterName('purl',document.location.search);
					if (proxyurl)
					{
						myconnoptions.proxyUrl = proxyurl;
					}
					else
					{
						myconnoptions.proxyUrl = 'https://localhost:8443/proxy';
					}

					myconn = new jsforce.Connection(myconnoptions);

					CurrentUserHasModifyAllDataAccess(myconn, myuserid, function(err, hasaccessresult, myuserdetails)
					{
						try
						{
							if (err)
							{
								ProcessError(err);
							}
							else
							{
								if (hasaccessresult == false)
								{
									ProcessError('Error: You must have permission Modify All Data to use this page!');
								}
								else
								{
									var myquery = "SELECT Id,Name FROM Organization where Id = '"+myOrgId+"'";
									QueryRecords(myconn, myquery, function(Orgyerr, OrgResults)
									{
										if (Orgyerr)
										{
											ProcessError('Error:' + Queryerr);
										}
										else
										{
											j$('#userdetail').html((myuserdetails.Name + ' AT '+ OrgResults[0].Name +' ON API ' + jsforceAPIVersion).toUpperCase() );
		        							j$('#loginDetails').show();
		        							myconn.identity(function(err, res) 
											{
												if (err) 
										  		{ 
											  		ProcessError(err); 
											  	}
											  	else
											  	{
											  		if (res.urls && res.urls.users)
											  		{
														//console.log("user ID: " + res.user_id);
														//console.log("organization ID: " + res.organization_id);
														//console.log("username: " + res.username);
														//console.log("display name: " + res.display_name);
														var link = document.createElement('a');
														//  set href to any path
														link.setAttribute('href', res.urls.users);

														//  get any piece of the url you're interested in
														link.hostname;  //  'example.com'
														link.port;      //  12345
														link.search;    //  '?startIndex=1&pageSize=10'
														link.pathname;  //  '/blog/foo/bar'
														link.protocol;  //  'http:'

														//  cleanup for garbage collection
														link = null;
														if (!myconn.instanceUrl || myconn.instanceUrl == '')
														{
															myconn.instanceUrl = link.protocol + '//' + link.hostname;
														}
													}
													if (myconn.instanceUrl)
													{
														salesforceAccessURL = myconn.instanceUrl + '/secur/frontdoor.jsp?sid=' + myconn.accessToken + '&retURL='
													}

													var myquery = "SELECT Id,Body,Name FROM StaticResource where NamespacePrefix = '' and ContentType in ('text/plain','application/javascript','application/octet-stream')";
													QueryRecords(myconn, myquery, function(Queryerr, QueryResults)
													{
														if (Queryerr)
														{
															ProcessError('Error:' + Queryerr);
														}
														else
														{
															var searchfor = [];
															for (var ir1 = 0; ir1 < QueryResults.length; ir1++)
															{
																searchfor.push(QueryResults[ir1].Name);
															}
															var mypackage = {'types': [],'version': jsforceAPIVersion};
															mypackage.types.push({'members': searchfor,'name': 'StaticResource'});
															myconn.metadata.retrieve({unpackaged: mypackage}, function(retreiveerr, retreivemetadata)
															{
																try
																{
																	if (retreiveerr)
																	{
																		ProcessError(retreiveerr);
																	}
																	else
																	{
																		DocheckRetrieveStatus(myconn, retreivemetadata.id, function(retreivemetadataresulterr, retreivemetadataresult)
																		{
																			try
																			{
																				if (retreivemetadataresulterr)
																				{
																					ProcessError(retreivemetadataresulterr);
																				}
																				else
																				{
																					AddZipContentsToHashTableAsJson(retreivemetadataresult.zipFile, function(zipresultserr, zipresults)
																					{
																						try
																						{
																							if (zipresultserr)
																							{
																								ProcessError(zipresultserr);
																							}
																							else
																							{
																								var presult = '';

																								presult += '<style>button:disabled {border: 2px outset ButtonFace;  color: GrayText;  cursor: inherit;  background-color: #ddd;  background: #ddd;}</style>';

																								presult += '<div id="header">Select Resorurce: ';
																								presult += '<select id="sel1" onchange="OnSelectChange(this.value)">';
																								if (QueryResults)
																								{
																									presult += '<option value="">--None--</option>';
																									for (var ir1 = 0; ir1 < QueryResults.length; ir1++)
																									{
																										var QueryResult = QueryResults[ir1];

																										var metaname = 'unpackaged/staticresources/' + QueryResult.Name + '.resource';
																										if (zipresults.hasItem(metaname) == true)
																										{
																											var mydetail = zipresults.getItem(metaname);
																											if(mydetail)
																											{
																												var metadetail;
																												var metadetailname = 'unpackaged/staticresources/' + QueryResult.Name + '.resource-meta.xml';
																												if (zipresults.hasItem(metadetailname) == true)
																												{
																													var mymetadetail = zipresults.getItem(metadetailname);
																													if(mymetadetail)
																													{
																														metadetail = mymetadetail;
																													}
																												}
																												finalresult.push({Name:QueryResult.Name,Body:mydetail,Metadetail:metadetail});
																												presult += '<option value="'+QueryResult.Name+'">'+QueryResult.Name+'</option>';
																											}
																										}
																									}
																								}

																								presult += '</select>';
																								presult += '<button id="bntcancel" onclick="docancel();" style="display:none;" type="button">Cancel</button>';
																								presult += '<button id="bntsave" onclick="dosave();" style="display:none;" type="button">Save</button>';

																								presult += '</div>';

																								presult += '<div id="main">';

																								presult += '<textarea id="texteditor" style="display:none;width: 100%; height: 800px;" />';
																								presult += '<div id="jsoneditor" style="display:none;width: 100%; height: 800px;"></div>'

																								presult += '</div>';

																								presult += '<div id="footer">';

																								presult += '</div>';
																								RemoteResult = finalresult;
																								j$("#MainDetail").LoadingOverlay("hide");
																								j$("#mainContent").html(presult);

																								//var button = $("#buttonId");
																								j$("#texteditor").on('input',function(e)
																								{
																								  if(e.target.value === currenteditorvalue)
																								  {
																								  	j$('#sel1').removeAttr('disabled');
																								    j$("#bntcancel").hide();
																								    j$("#bntsave").hide();
																								  } 
																								  else 
																								  {
																								  	j$('#sel1').attr('disabled','disabled');
																								    j$("#bntcancel").show();
																								    j$("#bntsave").show();
																								  }
																								});
																								
																							}
																						}
																						catch (err)
																						{
																							console.log(err);
																							ProcessError(err);
																							throw err;
																						}
																					});
																				}
																			}
																			catch (err)
																			{
																				console.log(err);
																				ProcessError(err);
																				throw err;
																			}
																		});
																	}
																}
																catch (err)
																{
																	console.log(err);
																	ProcessError(err);
																	throw err;
																}
															});
														}
													});
												}
											});
										}

									});
								}
							}
						}
						catch (err)
						{
							console.log(err);
							ProcessError(err);
							throw err;
						}
					});
				}
		    }
	    });
    }
    else
    {
    	j$('#logindiv').show();
    }
	
});



/******************Support Functions *************************************/

	function getParameterName(name,loc) 
	{
	    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	        results = regex.exec(loc);
	    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}

	function GetOauth(state2)
	{
		var oauth2Options = 
		{
		    clientId: '3MVG9xOCXq4ID1uEUdmtqOVR2qv7cJ9kiRrlXA3pGbBJklG_lYrhdalyWQflXDiDRWb0IPLfYiAz7xN.lhOfq',
		    clientSecret: '3676781568829065227',
		    redirectUri: 'https://localhost:8443/FX_Resourse_Editor/test.htm?purl=https://localhost:8443/proxy'
		};

		

		var proxyurl = getParameterName('purl',document.location.search);
		if (proxyurl)
		{
			oauth2Options.proxyUrl = proxyurl;
		}
		else
		{
			oauth2Options.proxyUrl = 'https://localhost:8443/proxy';
		}
		var myloginUrl;
		if (state2)
		{
			if (state2 == 'Sandbox')
			{
				myloginUrl = 'https://test.salesforce.com';
			}
			else
			{
				myloginUrl = 'https://login.salesforce.com';
			}
		}
		if (myloginUrl)
		{
			oauth2Options.loginUrl = myloginUrl;
		}
		return new jsforce.OAuth2(oauth2Options);
	}

	
	
	function getJsonData(j)
	{
		var jsondata = j;
		if (jsondata.startsWith('window.FX_Mobile_Filters ='))
		{
			jsondata = jsondata.substring('window.FX_Mobile_Filters ='.length);
		}
		if (jsondata.startsWith('window.FX_Mobile_Filters='))
		{
			jsondata = jsondata.substring('window.FX_Mobile_Filters='.length);
		}

		if (jsondata.startsWith('window.FX_Mobile_Rules ='))
		{
			jsondata = jsondata.substring('window.FX_Mobile_Rules ='.length);
		}
		if (jsondata.startsWith('window.FX_Mobile_Rules='))
		{
			jsondata = jsondata.substring('window.FX_Mobile_Rules='.length);
		}
		return jsondata;
	}

	function CurrentUserHasModifyAllDataAccess(conn, tid, callback)
	{
		var myquery = "select Id, UserName, UserRole.Name, UserRoleId,Name,ProfileId,Profile.PermissionsModifyAllData from User where id ='" + tid + "'";
		var HasModifyAllDataAccess = false; // this is needed to access the metadata api
		QueryRecords(conn, myquery, function(UserQueryerr, UserQueryResults)
		{
			if (UserQueryerr)
			{
				callback('Error:' + UserQueryerr, null, null)
			}
			var myUser = UserQueryResults[0];
			var HasModifyAllDataAccess = myUser.Profile.PermissionsModifyAllData;
			if (HasModifyAllDataAccess == true)
			{
				callback(null, true, myUser);
			}
			else
			{
				myquery = "select Id, PermissionsModifyAllData from PermissionSet where IsOwnedByProfile = false and Id in (SELECT PermissionSetId FROM PermissionSetAssignment where AssigneeId = '" + tid + "')";
				QueryRecords(conn, myquery, function(PermissionSetQueryerr, PermissionSetQueryResults)
				{
					if (PermissionSetQueryerr)
					{
						callback('Error:' + PermissionSetQueryerr, null)
					}
					else
					{
						//console.log(PermissionSetQueryResults);
						if (PermissionSetQueryResults != undefined)
						{
							for (var i = 0; i < PermissionSetQueryResults.length; i++)
							{
								var QueryResult = PermissionSetQueryResults[i];
								if (QueryResult.PermissionsModifyAllData == true)
								{
									HasModifyAllDataAccess = true;
									//callback(null,true);
									break;
								}
							}
						}
						callback(null, HasModifyAllDataAccess, myUser);
					}
				});
			}
		});
	}

	function AddZipContentsToHashTableAsJson(data, callback)
	{
		var batchs = [];
		var results = new HashTable();
		var new_zip = new JSZip();
		var errorhasoccured = false;
		new_zip.loadAsync(data,
			{
				base64: true
			})
			.then(function(zip)
			{
				j$.each(new_zip.files, function(index, zipEntry)
				{
					batchs.push(zipEntry.name);
				});
				j$.each(new_zip.files, function(index, zipEntry)
				{
					ReadFileToString(new_zip, zipEntry.name, function(err, path, result)
					{
						if (result == undefined || result == null || err)
						{
							callback('Bad Data in File: ' + path, null);
						}
						var mybatchindex = batchs.indexOf(path);
						if (mybatchindex < 0)
						{
							errorhasoccured = true;
							callback('batch not found!', null);
						}
						batchs.splice(mybatchindex, 1);
						var rawresult = result;
						if (!zipEntry.name.endsWith('.resource'))
						{
							var x2js = new X2JS();
							rawresult = x2js.xml_str2json(result);
						}
						results.setItem(path, rawresult);
						if (batchs.length == 0)
						{
							if (errorhasoccured == false)
							{
								callback(null, results);
							}
						}
					});
				});
			});
	}

	function ReadFileToString(myzip, mypath, callback)
	{
		var rawdata = myzip.file(mypath).async("string")
			.then(function(data)
			{
				callback(null, mypath, data);
			});
	}

	function ProcessError(error)
	{
		alert(error);
	}

	function QueryRecords(conn, myquery, callback)
	{
		var records = [];
		var query = conn.query(myquery)
			.on("record", function(record)
			{
				records.push(record);
				//console.log(record);
			})
			.on("end", function()
			{
				callback(null, records);
				//console.log("total in database : " + query.totalSize);
				//console.log("total fetched : " + query.totalFetched);
			})
			.on("error", function(err)
			{
				//console.error(err);
				callback(err, null);
			})
			.run(
			{
				autoFetch: true,
				maxFetch: 4000
			}); //
	}

	function QueryToolingRecords(conn, myquery, callback)
	{
		var records = [];
		var query = conn.tooling.query(myquery)
			.on("record", function(record)
			{
				records.push(record);
				//console.log(record);
			})
			.on("end", function()
			{
				callback(null, records);
				//console.log("total in database : " + query.totalSize);
				//console.log("total fetched : " + query.totalFetched);
			})
			.on("error", function(err)
			{
				//console.error(err);
				callback(err, null);
			})
			.run(
			{
				autoFetch: true,
				maxFetch: 4000
			}); // synonym of Query#execute();
	}

	function DocheckRetrieveStatus(conn, id, callback)
	{
		conn.metadata.checkRetrieveStatus(id, function(err, result)
		{
			if (err)
			{
				callback(err, result);
			}
			else if (result.done == 'false')
			{
				console.log('Metadata API Retrieve Status: ' + result.status);
				setTimeout(function()
				{
					DocheckRetrieveStatus(conn, id, callback);
				}, 5000);
			}
			else if (result.done == 'true')
			{
				callback(err, result);
			}
		});
	}

	function GetAllCustomObject(conn, callback)
	{
		var lstquery = [
		{
			type: 'CustomObject'
		}];
		conn.metadata.list(lstquery, jsforceAPIVersion, function(err, metadata)
		{
			if (err)
			{
				callback(err, null);
			}
			else
			{
				var fullNames = [];
				for (var i = 0; i < metadata.length; i++)
				{
					var meta = metadata[i];
					fullNames.push(meta.fullName);
				}
				callback(null, fullNames);
			}
		});
	}

	function GetAllCustomTabs(conn, callback)
	{
		var lstquery = [
		{
			type: 'CustomTab'
		}];
		conn.metadata.list(lstquery, jsforceAPIVersion, function(err, metadata)
		{
			if (err)
			{
				callback(err, null);
			}
			else
			{
				/*
				var fullNames = [];
				for (var i = 0; i < metadata.length; i++)
				{
					var meta = metadata[i];
					fullNames.push(meta.fullName);
				}
				*/
				callback(null, metadata);
			}
		});
	}


	function HashTable()
	{
		this.length = 0;
		this.items = new Array();
		this.keys = new Array();
		for (var i = 0; i < arguments.length; i += 2)
		{
			if (typeof(arguments[i + 1]) != 'undefined')
			{
				this.items[arguments[i]] = arguments[i + 1];
				this.length++;
			}
		}
		this.removeItem = function(in_key)
		{
			var tmp_previous;
			if (typeof(this.items[in_key]) != 'undefined')
			{
				this.length--;
				var tmp_previous = this.items[in_key];
				delete this.items[in_key];
			}
			if (this.keys.indexOf(in_key) >= 0)
			{
				this.keys.splice(this.keys.indexOf(in_key), 1);
			}
			return tmp_previous;
		}
		this.getItem = function(in_key)
		{
			return this.items[in_key];
		}
		this.getItemAt = function(index_key)
		{
			return this.items[index_key];
		}
		this.setItem = function(in_key, in_value)
		{
			var tmp_previous;
			if (typeof(in_value) != 'undefined')
			{
				if (typeof(this.items[in_key]) == 'undefined')
				{
					this.length++;
				}
				else
				{
					tmp_previous = this.items[in_key];
				}
				if (this.keys.indexOf(in_key) < 0)
				{
					this.keys.push(in_key);
				}
				this.items[in_key] = in_value;
			}
			return tmp_previous;
		}
		this.hasItem = function(in_key)
		{
			return typeof(this.items[in_key]) != 'undefined';
		}
		this.clear = function()
		{
			for (var i in this.items)
			{
				delete this.items[i];
			}
			this.length = 0;
			this.keys = [];
		}
	}

/******************END Support Functions *************************************/